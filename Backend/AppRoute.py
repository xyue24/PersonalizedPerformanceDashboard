from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import InterfaceImplementation

cred = credentials.Certificate("Config/firebase_credentials.json")
firebase_admin.initialize_app(cred)

database = firestore.client()

app = Flask(__name__)
CORS(app)

#   Frontend APIs
# route for file uploads
@app.route('/upload_files', methods=['POST'])
def upload_files():
    msg, index = InterfaceImplementation.upload_files(database)
    return jsonify(msg), index

@app.route('/remove_course', methods=['POST'])
def remove_course():
    msg, index = InterfaceImplementation.remove_course(database)
    return jsonify(msg), index

@app.route('/get_course_list', methods=['POST'])
def get_course_list():
    msg, index = InterfaceImplementation.get_course_list(database)
    return jsonify(msg), index

@app.route('/get_chart_data', methods=['POST'])
def get_chart_data():
    msg, index = InterfaceImplementation.get_chart_data(database)
    return jsonify(msg), index



# Run the app
if __name__ == '__main__':
    InterfaceImplementation.initial(database)
    app.run(port=5000)