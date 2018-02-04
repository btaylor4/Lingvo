# server.py
from flask import Flask, render_template, redirect, url_for, request
from flask.ext.pymongo import PyMongo
from flask_socketio import SocketIO
from flask_socketio import send, emit

app = Flask(__name__, static_folder="../static/dist", template_folder="../static")
app.config['MONGO_DBNAME'] = "lingvo"
app.config['MONGO_URI'] = "mongodb://lingvoadmin:webrtc@ds117758.mlab.com:17758/lingvo"
socketio = SocketIO(app)
mongo = PyMongo(app)
    
@socketio.on('message')
def handle_message(message):
    emit('message', message)

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
                return redirect(url_for('home'))
            error = 'Invalid Credentials. Please try again.'  
            return error
    return render_template('login.html', error=error)
        
@app.route("/user-portal")
def home():
    return render_template("index.html")
    
@app.route("/")
def index():
    return render_template("home.html")

if __name__ == "__main__":
    socketio.run(app, debug="true")
    #app.run(debug="true")