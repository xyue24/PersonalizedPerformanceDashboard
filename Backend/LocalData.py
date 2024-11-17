from dotenv import load_dotenv
from firebase_admin import credentials, firestore
import firebase_admin
import json
import os

class DatabaseManager:
    _instance = None

    def __init__(self):
        if not DatabaseManager._instance:
            load_dotenv()
            cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_ADMIN_SDK')))
            self.app =firebase_admin.initialize_app(cred)
            self.database = firestore.client()
            # local data instance initial
            self.outlier = 180
            self.category = {'Tech_Data': {}, 'Learn_Data': {}}
            self.category['Tech_Data'] = self.database.collection('Tech_Data').document('category').get().to_dict()
            self.category['Learn_Data'] = self.database.collection('Learn_Data').document('category').get().to_dict()
            self.collection = 'Exam_Date'
            self.chart_data = {}
            self.statis_data = {}

            DatabaseManager._instance = self

    @staticmethod
    def get_instance():
        if not DatabaseManager._instance:
            DatabaseManager()
        return DatabaseManager._instance
    
    # update category to local & database
    def update_category(self, collection_id, new_value):
        cate = self.category[collection_id]
        cate[new_value] = len(cate)
        self.database.collection(collection_id).document('category').set(cate)
        return

    def upload_doc(self, collection_id, doc_id, data):
        self.database.collection(collection_id).document(doc_id).set(data)
        return
    
    def fetch_doc(self, collection_id, doc_id):
        return self.database.collection(collection_id).document(doc_id).get()
    
    def delete_doc(self, collection_id, doc_id):
        self.database.collection(collection_id).document(doc_id).delete()
        return
    
    def fetch_doc_list(self, collection_id):
        return self.database.collection(collection_id).stream()

    def simplify_local_data(self, collection_id, doc_list):
        if collection_id != self.collection:
            self.collection = collection_id
            self.chart_data.clear()
            self.statis_data.clear() 
        temp_dict = {}
        temp_dict = {key: value for key, value in self.chart_data.items() if key not in doc_list}
        self.chart_data = temp_dict.copy()
        temp_dict = {key: value for key, value in self.statis_data.items() if key not in doc_list}
        self.statis_data = temp_dict.copy()
        return

# Initialize the singleton when the module is loaded
database_manager = DatabaseManager.get_instance()


