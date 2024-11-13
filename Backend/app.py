from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import InterfaceImplementation
import os
import json

load_dotenv()

cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_ADMIN_SDK')))
firebase_admin.initialize_app(cred)

database = firestore.client()

app = Flask(__name__, static_folder='../Frontend', template_folder='../Frontend')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.template_folder, 'MainPage.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

#   Frontend APIs
# route for file uploads
@app.route('/api/upload_files', methods=['POST'])
def upload_files():
    msg, index = InterfaceImplementation.upload_files(database)
    return jsonify(msg), index

@app.route('/api/remove_course', methods=['POST'])
def remove_course():
    msg, index = InterfaceImplementation.remove_course(database)
    return jsonify(msg), index

@app.route('/api/get_course_list', methods=['POST'])
def get_course_list():
    msg, index = InterfaceImplementation.get_course_list(database)
    return jsonify(msg), index

@app.route('/api/get_chart_data', methods=['POST'])
def get_chart_data():
    msg, index = InterfaceImplementation.get_chart_data(database)
    return jsonify(msg), index



# Run the app
if __name__ == '__main__':
    InterfaceImplementation.initial(database)
    app.run(port=5000)