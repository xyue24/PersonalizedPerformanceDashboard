import pandas as pd
from flask import jsonify, request
import os

# Instance
collection_map = {
        'time_chart': 'Exam_Data',
        'tech_chart': 'Tech_Data',
        'learn_chart': 'Learn_Data'
    }

tech_chart_category = {}
learn_chart_category = {}


#   Implementation of APIs

# Endpoint to handle multiple file uploads and direct data to specific collections
def upload_files(database):
    # Check if the request contains files
    if 'files' not in request.files:
        return {"error": "No files part in the request"}, 400
    
    # Get list of files from the request
    files = request.files.getlist('files')

    for file in files:
        # only process .xls and .xlsx file
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.xls', '.xlsx']:
            continue

         # read each page name
        file_sheets = pd.ExcelFile(file).sheet_names     
        # read each sheet
        for sheet in file_sheets:
            # check sheet chart type
            data_frame = pd.read_excel(file, sheet_name=sheet)

            if "Score" in data_frame.columns:
                collection_name = 'Exam_Data'
            elif "Techniques Adopted" in data_frame.columns:
                collection_name = 'Tech_Data'
            elif "Learning_Method" in data_frame.columns:
                collection_name = 'Learn_Data'
            else:
                continue

            add_data_to_firestore(collection_name, data_frame, database)

    return {"message": "Files upload successfully"}, 200

# Endpoint to remove docs from database
def remove_course(database):
    # get data from frontend
    receive_data = request.json
    chart_type = receive_data.get('type')
    remove_courses = receive_data.get('list', [])
    print(f"type{chart_type}, remove{remove_courses}")

    collection_name = collection_map[chart_type]

    for course in remove_courses:
        database.collection(collection_name).document(course).delete()

    return {"message": "Course Remove Success"}, 400

# Endpoint to dynamically fetch the course list
def get_course_list(database):
    # chart type exception handle
    chart_type = request.json.get('type')
    if chart_type not in collection_map:
        return {"error": "Invalid chart type specified"}, 400
    
    collection_name = collection_map[chart_type]
    docs = database.collection(collection_name).stream()
    course_list = [doc.id for doc in docs]
    course_list = [name for name in course_list if name != 'category']

    return {"list": course_list}, 200

def get_chart_data(database):
    receive_data =  request.json
    type = receive_data.get('type')
    courses = receive_data.get('course_list', [])
    courses = [item for item in courses if item != ""]

    collection_name = collection_map[type]

    return fetch_data_from_collection(collection_name, database, courses), 200

#   Support Functions

# Function to add data to Firestore from a DataFrame
def add_data_to_firestore(collection_name, data_frame, database):
    # catch course_number, semester, year as map key
    course, semester, year = '', '', ''

    course = data_frame['Course_Number'].dropna().iloc[0]
    data_frame = data_frame.drop(columns=['Course_Number'], errors='ignore')

    semester = data_frame['Semester'].dropna().iloc[0]
    data_frame = data_frame.drop(columns=['Semester'], errors='ignore')

    year = str(int(data_frame['Year'].dropna().iloc[0]))
    data_frame = data_frame.drop(columns=['Year'], errors='ignore')

    course_key = (course + semester + year).replace(" ", "")

    # parse data base on collection_name
    course_data = {}
    if collection_name == 'Exam_Data':
        data_frame = data_frame.dropna(subset=['Score'])
        data_list = data_frame.columns.tolist()
        for data in data_list:
            course_data[data] = data_frame[data].tolist()

    elif collection_name == 'Tech_Data':
        data_frame = data_frame.dropna(subset=['Unnamed: 3'])
        course_data['Techniques Adopted'] = [item.strip() for item in data_frame['Techniques Adopted'].tolist()]
        course_data['Count'] = data_frame['Count'].tolist()
        # update category
        global tech_chart_category
        if tech_chart_category is None:
            tech_chart_category = {}
        for item in course_data['Techniques Adopted']:
            if item not in tech_chart_category:
                tech_chart_category[item] = len(tech_chart_category)
                database.collection(collection_name).document('category').set(tech_chart_category)

    elif collection_name == 'Learn_Data':
        data_frame = data_frame.dropna(subset=['Unnamed: 3'])
        course_data['Learning_Method'] = [item.strip() for item in data_frame['Learning_Method'].tolist()]
        course_data['Formula'] = data_frame['Formula'].tolist()
        # update category
        global learn_chart_category
        if learn_chart_category is None:
            learn_chart_category = {}
        for item in course_data['Learning_Method']:
            if item not in learn_chart_category:
                learn_chart_category[item] = len(learn_chart_category)
                database.collection(collection_name).document('category').set(learn_chart_category)
    
    # add into database
    database.collection(collection_name).document(course_key).set(course_data)
        
# Function to fetch data from a specific collection and only specified columns
def fetch_data_from_collection(collection_name, database, doc_list):
    fetch_category(database)
    chart_data = {}

    global tech_chart_category
    global learn_chart_category

    if collection_name == 'Tech_Data':
        chart_data['category'] = list(tech_chart_category.keys())
    elif collection_name == 'Learn_Data':
        chart_data['category'] = list(learn_chart_category.keys())
    
    # loop throught doc id list
    for doc in doc_list:
        base_data = database.collection(collection_name).document(doc).get()
        if not base_data.exists:    # check id valid
            continue
        base_data = base_data.to_dict()                     # get data dictionary
        data_size = len(base_data[next(iter(base_data))])   # get data size
        chart_data[doc] = []

        if collection_name == 'Exam_Data':
            chart_data['category'] =[]

            for i in range(data_size):
                chart_data[doc].append({'x': base_data['Score'][i],'y': base_data['Time'][i]}) 

        elif collection_name == 'Tech_Data':
            chart_data[doc] = [0] * len(tech_chart_category)
            for i in range(data_size):
                chart_data[doc][tech_chart_category[base_data['Techniques Adopted'][i].strip()]] = base_data['Count'][i]

        elif collection_name == 'Learn_Data':
            chart_data[doc] = [0] * len(learn_chart_category)
            for i in range(data_size):
                chart_data[doc][learn_chart_category[base_data['Learning_Method'][i].strip()]] = base_data['Formula'][i]
        
    return chart_data

# get chart category from database
def fetch_category(database):
    global tech_chart_category
    tech_chart_category = database.collection('Tech_Data').document('category').get().to_dict()
    global learn_chart_category
    learn_chart_category = database.collection('Learn_Data').document('category').get().to_dict()

def initial(database):
    fetch_category(database)


