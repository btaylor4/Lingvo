# server.py
from flask import Flask, render_template, redirect, url_for, request, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask.ext.pymongo import PyMongo
from flask_socketio import SocketIO
from flask_socketio import send, emit
from bson import json_util, ObjectId
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
        
        # sendToClient(socketio, {
        #     "type": "offer", 
        #     "offer": message["offer"]
        # })

    elif(message["type"] == "answer"):
         # person we want to send answer to, after recieved offer
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        
        sendToRoom(socketio, {
            "type": "answer", 
            "answer": message["answer"],
            "room": room
        })

        # sendToClient(socketio, {
        #     "type": "answer", 
        #     "answer": message["answer"]
        # })

    elif(message["type"] == "candidate"):
        requested_user = mongo.db.users.find_one({'username': message["id"]})
        room = connectedUsers[requested_user["username"]]
        
        sendToRoom(socketio, {
            "type": "candidate", 
            "candidate": message["candidate"],
            "room": room
        })
        
        # sendToClient(socketio, {
        #     "type": "candidate", 
        #     "candidate": message["candidate"]
        # })
        
    elif(message["type"] == "getUsers"):
        users = list(mongo.db.users.find())
        for u in users: # Make sure to only return necessary information
            del u['password']
        
        sendToClient(socketio, {
            "type": "gotUsers", 
            "users": json.loads(json_util.dumps(users))
        })
        
    elif(message["type"] == "getSession"):
        connectedUsers[message["user"]] = request.sid
        sendToClient(socketio, {
            "type": "session", 
            "sid": request.sid
        })
        
@app.route('/register', methods=['GET', 'POST']) # sets up the page for registration
def register():
    if request.method == 'POST':
        # construct user
        # name = request.form['firstname']
        username = request.form['username']
        password = request.form['password']
    
        requested_user = mongo.db.users.find_one({'username': username}) # searches the data base for the username chosen
        if requested_user is None:
            mongo.db.users.insert({'username': username, 'password': password}) # makes a new user inside data base if non already exits
            return redirect(url_for('index')) # send back to landing page
    
        else:
            return 'Username has already been taken'
            
    return render_template('registration.html')
                        

@app.route('/login', methods=['GET', 'POST']) # sets up the page for registration
def login():
    if request.method == 'POST':
        requested_user = mongo.db.users.find_one({'username': request.form['username']})
        if requested_user:
            if requested_user['password'].encode('utf-8') != request.form['password'].encode('utf-8'):
                return 'Invalid Credentials. Please try again.' 
            else:
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