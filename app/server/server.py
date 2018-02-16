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

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['MONGO_DBNAME'] = "lingvo"
app.config['MONGO_URI'] = "mongodb://lingvoadmin:webrtc@ds117758.mlab.com:17758/lingvo"
app.secret_key = os.urandom(24)
socketio = SocketIO(app)
mongo = PyMongo(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    user = mongo.db.users.find_one({"username": user_id})
    if not user:
        return None
    return User(user['_id'])
    
connectedUsers = {}

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

<<<<<<< HEAD
    elif(message["type"] == "candidate"):
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        
        sendToRoom(socketio, {
            "type": "candidate", 
            "candidate": message["candidate"],
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
        
@app.route('/register', methods=['GET', 'POST']) # sets up the page for registration
=======
@socketio.on('audio', namespace='/test')
def handle_audio(data):
  print('received' + str(data))

  # Call to client speech api here

@app.route('/register', methods=['GET', 'POST'])
>>>>>>> Clientside audio chunking passing to server
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
<<<<<<< HEAD
    socketio.run(app, debug=True) # debug = true to put in debug mode
=======
    socketio.run(app, debug="true")
>>>>>>> Clientside audio chunking passing to server
