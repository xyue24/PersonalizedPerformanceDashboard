import pandas as pd
from LocalData import database_manager
import statistics
from scipy.stats import pearsonr


# Processing excel files, getting types and distributing them to different methods
def upload_excel_files(file):
    # read each page name
    file_sheets = pd.ExcelFile(file).sheet_names     
    # read each sheet
    for sheet in file_sheets:
        data_frame = pd.read_excel(file, sheet_name=sheet)
        # remove invalid sheet
        if 'Course_Number' not in data_frame.columns:
            continue
        # parse datas ( get doc id )
        course = data_frame['Course_Number'].dropna().iloc[0]
        semester = data_frame['Semester'].dropna().iloc[0]
        year = str(int(data_frame['Year'].dropna().iloc[0]))
        doc_id = (course + semester + year).replace(" ", "")
        print(doc_id)
        # distributing them to different funcs
        collection_name = ""
        doc_data = {}
        if "Score" in data_frame.columns:
            collection_name = 'Exam_Data'
            doc_data = upload_exam_data(data_frame)
        elif "Techniques Adopted" in data_frame.columns:
            collection_name = 'Tech_Data'
            doc_data = upload_tech_data(data_frame)
        elif "Learning_Method" in data_frame.columns:
            collection_name = 'Learn_Data'
            doc_data = upload_learn_data(data_frame)
        else:
            continue
        # store into database
        database_manager.upload_doc(collection_name, doc_id, doc_data)
    return

# parse exam score sheet into dict
def upload_exam_data(data_frame):
    course_data = {}
    # remove empty data
    data_frame = data_frame.drop(columns=['Course_Number'], errors='ignore')
    data_frame = data_frame.drop(columns=['Semester'], errors='ignore')
    data_frame = data_frame.drop(columns=['Year'], errors='ignore')
    data_frame = data_frame.dropna(subset=['Score'])
    # parse required data
    data_list = data_frame.columns.tolist()
    for data in data_list:
        course_data[data] = data_frame[data].tolist()
    return course_data

# parse tech sheet into dict
def upload_tech_data(data_frame):
    course_data = {}
    # remove useless data
    data_frame = data_frame.dropna(subset=['Unnamed: 3'])
    course_data['Techniques Adopted'] = [item.strip() for item in data_frame['Techniques Adopted'].tolist()]
    course_data['Count'] = data_frame['Count'].tolist()
    # update category
    for item in course_data['Techniques Adopted']:
        if item not in database_manager.category['Tech_Data']:
            database_manager.update_category('Tech_Data', item)
    return course_data

# parse learn sheet into dict
def upload_learn_data(data_frame):
    course_data = {}
    # remove useless data
    data_frame = data_frame.dropna(subset=['Unnamed: 3'])
    course_data['Learning_Method'] = [item.strip() for item in data_frame['Learning_Method'].tolist()]
    # effective value
    course_data['1'] = data_frame['Results_of_Survey'].astype(int).tolist()
    course_data['2'] = data_frame['Unnamed: 6'].astype(int).tolist()
    course_data['3'] = data_frame['Unnamed: 7'].astype(int).tolist()
    course_data['4'] = data_frame['Unnamed: 8'].astype(int).tolist()
    course_data['5'] = data_frame['Unnamed: 9'].astype(int).tolist()
    # formula score
    course_data['Formula'] = data_frame['Formula'].tolist()
    # update category
    for item in course_data['Learning_Method']:
        if item not in database_manager.category['Learning_Method']:
            database_manager.update_category('Learning_Method', item)
    return course_data

def fetch_database_data(collection_id, doc_list):
    # create container
    chart_data = database_manager.chart_data
    statis_data = database_manager.statis_data
    # remove useless data from temp local database
    database_manager.simplify_local_data(collection_id, doc_list)
    # add category into container
    chart_data['category'] = []
    if collection_id != 'Exam_Data':
        database_data = database_manager.fetch_doc(collection_id, 'category').to_dict()
        chart_data['category'] = list(database_data.keys())
    # loop through required docs
    for doc in doc_list:
        # read and parse data from database
        if doc in chart_data:
            continue
        database_data = database_manager.fetch_doc(collection_id, doc)
        if not database_data.exists:    # check id valid
            continue
        database_data = database_data.to_dict().copy()          # initial data set
        # fetch data by its type
        if collection_id == 'Exam_Data':
            fetch_exam_data(database_data, doc, chart_data, statis_data)
        elif collection_id == 'Tech_Data':
            statis_data['non_data'] = 'non_data'
            fetch_tech_data(database_data, doc, chart_data)
        elif collection_id == 'Learn_Data': 
            statis_data['non_data'] = 'non_data'
            fetch_learn_data(database_data, doc, chart_data)
    chart_data['statis'] = get_statis_value(collection_id, statis_data)
    return chart_data, 200

def fetch_exam_data(data, doc, chart_data, statis_data):
    # exclude outliers
    outlier = database_manager.outlier
    for i in range(len(data['Time'])):
        if data['Time'][i] > outlier:
            for key in data:
                del data[key][i]
    # parse data into chart_data
    chart_data[doc] = []
    for i in range(len(data['Time'])):
        chart_data[doc].append({'Time': data['Time'][i], 'Score': data['Score'][i]})  
    # parse data to statis data
    if 'Time' not in statis_data:
        statis_data['Time'] = []
        statis_data['Score'] = []
    statis_data['Time']  += data['Time'].copy()
    statis_data['Score'] += data['Score'].copy()
    return

def fetch_tech_data(data, doc, chart_data):
    category = database_manager.category['Tech_Data']
    chart_data[doc] = [0] * len(category)
    for i in range(len(data['Count'])):
        chart_data[doc][category[data['Techniques Adopted'][i].strip()]] = data['Count'][i]

    return

def fetch_learn_data(data, doc, chart_data):
    category = database_manager.category['Learn_Data']
    chart_data[doc] = [0] * len(category)
    for i in range(len(data['Formula'])):
        chart_data[doc][category[data['Learning_Method'][i].strip()]] = data['Formula'][i]
    return

# delete data from database
def delete_data(collection_id, doc_list):
    for doc in doc_list:
        database_manager.delete_doc(collection_id, doc)
    return

# get the list of doc of collection
def get_doc_list(collection_id):
    available_docs = database_manager.fetch_doc_list(collection_id)
    doc_list = [doc.id for doc in available_docs]
    doc_list = [name for name in doc_list if name != 'category']
    return doc_list

def get_statis_value(collection_id, statis_data):
    # handle invalid input
    if collection_id != 'Exam_Data' or 'Time' not in statis_data:
        return {}
    # analysis data
    container = {}
    container['Data Size'] = len(statis_data['Time'])
    container['SD Score'] = round(statistics.stdev(statis_data['Score']), 2)
    container['SD Time'] = round(statistics.stdev(statis_data['Time']), 2)
    container['Correlation'], container['P-Value'] = pearsonr(statis_data['Score'], statis_data['Time'])
    container['Correlation'] = round(float(container['Correlation']), 2)
    container['P-Value'] = round(float(container['P-Value']), 2)
    container['Score Mean'] = round(float(sum(statis_data['Score']) / container['Data Size']), 2)
    container['Time Mean'] = round(float(sum(statis_data['Time']) / container['Data Size']), 2)
    # Quadrants Count
    quadrants_count = [0, 0, 0, 0]
    for i in range(container['Data Size']-1):
        # Q1: x >= mean, y >= mean
        if statis_data['Time'][i] >= container['Time Mean'] and statis_data['Score'][i] >= container['Score Mean']:
            quadrants_count[0] += 1
        # Q2: x < mean, y >= mean
        elif statis_data['Time'][i] < container['Time Mean'] and statis_data['Score'][i] >= container['Score Mean']:
            quadrants_count[1] += 1
        # Q3: x < mean, y < mean
        elif statis_data['Time'][i] < container['Time Mean'] and statis_data['Score'][i] < container['Score Mean']:
            quadrants_count[2] += 1
        # Q3: x >= mean, y < mean
        else:
            quadrants_count[3] += 1
    # Quadrants Calculate
    container['Q1'] = f'{(round(float(quadrants_count[0] * 100 / container['Data Size']), 2))}%'
    container['Q2'] = f'{(round(float(quadrants_count[1] * 100 / container['Data Size']), 2))}%'
    container['Q3'] = f'{(round(float(quadrants_count[2] * 100 / container['Data Size']), 2))}%'
    container['Q4'] = f'{(round(float(quadrants_count[3] * 100 / container['Data Size']), 2))}%'

    return container
