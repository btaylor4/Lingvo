# server.py
from flask import Flask, render_template, redirect, url_for, request, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_pymongo import PyMongo
from flask_socketio import SocketIO
from flask_socketio import send, emit
from bson import json_util, ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json

app = Flask(__name__, static_folder="../static", template_folder="../static")
app.config['MONGO_DBNAME'] = "lingvo"
app.config['MONGO_URI'] = "mongodb://lingvoadmin:webrtc@ds117758.mlab.com:17758/lingvo"
app.secret_key = os.urandom(24)
socketio = SocketIO(app)
mongo = PyMongo(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

connectedUsers = {}

@login_manager.user_loader
def load_user(user_id):
    user = mongo.db.users.find_one({"username": user_id})
    if not user:
        return None
    return User(user['_id'])

class User():
    def __init__(self, username):
        self.username = username
        self.email = None

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.username
    
def sendToClient(connection, message):
    # connectedUsers[connection.name].send(message)
    connection.send(message)

def sendToRoom(connection, message):
    connection.send(message, room=message["room"])
                
@socketio.on('message')
def handle_message(message): # server has recieved a message from a client
    print(message)
    if(message["type"] == "offer"):
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        print(requested_user["username"])
        
        sendToRoom(socketio, {
            "type": "offer", 
            "offer": message["offer"],
            "room": room,
            "username": message["username"] # person sending offer's username
        })

    elif(message["type"] == "answer"):
         # person we want to send answer to, after recieved offer
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        
        sendToRoom(socketio, {
            "type": "answer", 
            "answer": message["answer"],
            "room": room
        })

    elif(message["type"] == "candidate"):
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        
        sendToRoom(socketio, {
            "type": "candidate", 
            "candidate": message["candidate"],
            "room": room
        })
        
    elif(message["type"] == "getFriends"):
        # get friends from database
        room = connectedUsers[message["user"]]
        cursor = mongo.db.users.find({
                'username': message["user"],
                'friends': { "$all": [] }
                })

        if "friends" in cursor:
            friends_list = list(cursor["friends"])
            if room is not None:
                sendToRoom(socketio, {
                    "type": "getFriends",
                    "friends": json.loads(json_util.dumps(friends_list)),
                    "room": room
                })

    elif(message["type"] == "getRequests"):
        # get friend requests when a user logs in
        room = connectedUsers[message["user"]]
        cursor = mongo.db.users.find_one({'username': message["user"]})
        if "friend_requests" in cursor:
            requests = list(cursor["friend_requests"])

            if room is not None:
                sendToRoom(socketio, {
                    "type": "notifications",
                    "requests": json.loads(json_util.dumps(requests)),
                    "room": room
                })

    elif(message["type"] == "friend_request"): #send the request
        print("Requester " + message["requester"])
        print("Reciever " + message["receiver"])

        friend_notifications = None
        room = connectedUsers[message["receiver"]]
        cursor = mongo.db.users.find_one({
                'username': message["receiver"],
                'friend_requests': { "$all": [] }
                })

        if cursor is not None: # check if user exists
            if "friend_requests" in cursor:
                friend_notifications = cursor["friend_requests"]

            if friend_notifications is not None: # check to see if they have a list yet
                if message["requester"] not in friend_notifications: # check if users is already in list
                    friend_notifications.append(message["requester"])
                    mongo.db.users.update(
                        { "username" : message["requester"]},
                        { "$set": 
                            {
                                "friend_requests": friend_notifications
                            } 
                        }
                    )

            else:
                friend_notifications = list()
                friend_notifications.append(message["requester"])
                mongo.db.users.update(
                    { "username" : message["receiver"]},
                    { "$set": 
                        {
                            "friend_requests": friend_notifications
                        } 
                    }
                )

        if room is not None:
            sendToRoom(socketio, {
                "type": "friend_request",
                "requests": json.loads(json_util.dumps(friend_notifications)),
                "username": message["requester"],
                "room": room
            }) 

    elif(message["type"] == "getUsers"):
        room = connectedUsers[message["user"]]
        
        users = list(mongo.db.users.find())
        for u in users: # Make sure to only return necessary information
            del u['password']
        
        # sendToRoom(socketio, {
        #     "type": "gotUsers", 
        #     "users": json.loads(json_util.dumps(users)),
        #     "room": room
        # })
        
        sendToClient(socketio, {
            "type": "gotUsers", 
            "users": json.loads(json_util.dumps(users))
        })
        
    elif(message["type"] == "getSession"):
        connectedUsers[message["user"]] = request.sid
        room = connectedUsers[message["user"]]
        
        # Not sure if this will work
        # sendToRoom(socketio, {
        #     "type": "session", 
        #     "sid": request.sid
        #     "room": room
        # })
        
        sendToClient(socketio, {
            "type": "session", 
            "sid": request.sid
        })

    elif(message["type"] == "leave"):
        sendToRoom(socketio, {
            "type": "leave",
            "room": connectedUsers[message["id"]]
        })
        
@socketio.on('audio', namespace='/test')
def handle_audio(data):
  print('received' + str(data))

  # Call to client speech api here
  
  # Have some sort of buffer queue

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # construct user
        # name = request.form['firstname']
        username = request.form['username']
        password = request.form['password']
        hashed_password = generate_password_hash(password, method='sha256')
        requested_user = mongo.db.users.find_one({'username': username}) # searches the data base for the username chosen
        if requested_user is None:
            mongo.db.users.insert({'username': username, 'password': hashed_password}) # makes a new user inside data base if non already exits
            return redirect(url_for('index')) # send back to landing page
    
        else:
            return 'Username has already been taken'
            
    return render_template('registration.html')
                        

@app.route('/login', methods=['GET', 'POST']) # sets up the page for registration
def login():
    if request.method == 'POST':
        requested_user = mongo.db.users.find_one({'username': request.form['username']})
        if requested_user:
            if check_password_hash(requested_user["password"], request.form['password']):
                connectedUsers[request.form['username']] = None
                user = User(username=request.form['username'])
                login_user(user)
                return redirect(url_for('home')) # send to page with video functionality
        return 'Invalid Credentials. Please try again.'
    return render_template('login.html')

@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('index'))
           
@app.route("/user-portal")
@login_required
def home():
    return render_template("index.html") #, username=session['username']
    
@app.route("/")
def index():
        return render_template("home.html")

if __name__ == "__main__":
    socketio.run(app, debug=True) # debug = true to put in debug mode
