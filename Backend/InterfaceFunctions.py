from flask import request
import os
import ProcessingFunctions

# Endpoint to handle multiple file uploads and direct data to specific collections
def upload_data():
    # Check if the request contains files
    if 'files' not in request.files:
        return {"error": "No files part in the request"}, 400
    # Get list of files from the request
    files = request.files.getlist('files')
    for file in files:  # loop through files
        # only process .xls and .xlsx file
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.xls', '.xlsx']:
            continue
        ProcessingFunctions.upload_excel_files(file)
    return {"message": "Files upload successfully"}, 200

# Endpoint to remove docs from database
def delete_data():
    # get data from frontend
    receive_data = request.json
    collection_id = receive_data.get('type')
    doc_list = receive_data.get('list', [])
    # delete
    ProcessingFunctions.delete_data(collection_id, doc_list)
    return {"message": "Course Remove Success"}, 200

# Endpoint to fetch the course list
def get_doc_list():
    # chart type exception handle
    collection_id = request.json.get('type')
    doc_list = ProcessingFunctions.get_doc_list(collection_id)
    return doc_list, 200

# Endpoint to fetch the course data
def get_doc_data():
    # get data from frontend
    receive_data =  request.json
    collection_id = receive_data.get('type')
    doc_list = receive_data.get('list', [])
    # fetch target datas
    data = ProcessingFunctions.fetch_database_data(collection_id, doc_list)
    return data, 200