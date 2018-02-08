# server.py
from flask import Flask, render_template, redirect, url_for, request, session
from flask.ext.pymongo import PyMongo
from flask_socketio import SocketIO
from flask_socketio import send, emit
import os

from OpenSSL import SSL
from werkzeug.serving import make_ssl_devcert
path = '/Users/Bryan/Desktop/College/UF/Computer Engineering/Senior Design CEN 4914/Lingvo/app/server/'
make_ssl_devcert(path, host='0.0.0.0')

context = (path + '.crt',path + '.key')

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['MONGO_DBNAME'] = "lingvo"
app.config['MONGO_URI'] = "mongodb://lingvoadmin:webrtc@ds117758.mlab.com:17758/lingvo"
app.secret_key = os.urandom(24)
socketio = SocketIO(app)
mongo = PyMongo(app)

connectedUsers = {}
    
def sentToClient(connection, message):
    # connectUsers[connection.name].send(message)
    connection.send(message)
    
@socketio.on('connect')
def handle_connection():
    if 'username' in session:
        print("User: " + session['username'] + " has logged in")
        connectedUsers[session['username']].send('hello')
            
@socketio.on('message')
def handle_message(message):
    if(message["type"] == "offer"):
        print(message)
        print("Sending offer to " + str(message["name"]))
        connect = connectedUsers[message["name"]]

        if(connect != None):
            # connect.otherName = message["name"]
            sentToClient(connect, {
                "type": "offer", 
                "offer": message["offer"],
                "name": connect.name
            })

    elif(message["type"] == "answer"):
        print("Sending answer to " + str(message["name"]))
        connect = connectedUsers[message["name"]]
        if(connect != None):
            socketio.otherUser = message["name"]
            sentToClient(connect, {
                "type": "answer", 
                "answer": message["answer"]
            })

    elif(message["type"] == "candidate"):
        print("Sending candidate to " + str(message["name"]))
        connect = connectedUsers[message["name"]]
        if(connect != None):
            sentToClient(connect, {
                "type": "candidate", 
                "candidate": message["candidate"]
            })

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # construct user
        # name = request.form['firstname']
        username = request.form['username']
        password = request.form['password']
    
        requested_user = mongo.db.users.find_one({'username': username})
        if requested_user is None:
            mongo.db.users.insert({'username': username, 'password': password})
            return redirect(url_for('home'))
    
        else:
            return 'Username has already been taken'
            
    return render_template('registration.html')
                        

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        requested_user = mongo.db.users.find_one({'username': request.form['username']})
        if requested_user:
            if requested_user['password'].encode('utf-8') != request.form['password'].encode('utf-8'):
                error = 'Invalid Credentials. Please try again.'
                return error    
            else:
                connectedUsers[request.form['username']] = socketio
                socketio.name = request.form['username']
                session['username'] = request.form['username']
                return redirect(url_for('home'))
            error = 'Invalid Credentials. Please try again.'  
            return error
    return render_template('login.html', error=error)
        
@app.route("/user-portal")
def home():
    return render_template("index.html", username=session['username'])
    
@app.route("/")
def index():
        return render_template("home.html")

if __name__ == "__main__":
    socketio.run(app, debug="true", host='0.0.0.0') # , ssl_context='adhoc' add this to make it work on sperate computers
    #app.run(debug="true")