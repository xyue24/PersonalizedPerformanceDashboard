from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sqlalchemy import create_engine

app = Flask(__name__)
CORS(app)

#Database engine (replace with your MySQL credentials)
engine = create_engine('mysql+mysqlconnector://root:voldy%40007@localhost/newdb')

#Initialize an empty courses list (will be populated dynamically)
courses_list = []

#Function to dynamically fetch Time and Score data from the database and concatenate course information
def fetchTimeScoreData():
    #Dictionary to store Time and Score for each course
    time_chart_dict = {}

    #Fetch all rows from ScoreTime table and concatenate Course_Number, Semester, and Year
    query = "SELECT Course_Number, Semester, Year, Time, Score FROM ScoreTime"
    df = pd.read_sql(query, con=engine)

    #Create a new column 'course' by concatenating 'Course_Number', 'Semester', and 'Year'
    df['course'] = df['Course_Number'] + df['Semester'] + df['Year'].astype(str)

    #Get unique courses
    unique_courses = df['course'].unique()

    #Clear courses_list to avoid duplicate entries if the function is called multiple times
    courses_list.clear()

    #For each unique course, add it to courses_list and store Time and Score in the dictionary
    for course in unique_courses:
        #Append the unique course identifier to courses_list
        courses_list.append(course)

        #Filter the data for this course and store Time and Score in time_chart_dict
        course_data = df[df['course'] == course][['Time', 'Score']].to_dict(orient='records')
        time_chart_dict[course] = course_data

    return time_chart_dict
    
    #print time_chart_dict[course]

# Example of how to call fetchTimeScoreData and print courses_list
time_chart_data = fetchTimeScoreData()
#print("Courses List:", courses_list)
#print("Time Chart Data:", time_chart_data)


tech_chart_dict = {}
tech_chart_category = ['Tools Connectivity Diagram',
                        'TDD',
                        'Version Control',
                        'Testing',
                        'Agile',
                        'Peer Reviews',
                        'CI/CD',
                        'Software Tools Selection',
                        'Semantic Versioning',
                        'Static Analysis',
                        'Documentation Repository',
                        'Refactoring',
                        'Group Collaboration',
                        'Writing User Stories',
                        'Automated Testing',
                        'Wireframes',
                        'Unit Test',
                        'Estimation']
tech_chart_dict['CS633Fall2024'] = [1, 5, 1, 1, 3, 11, 5, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1]
tech_chart_dict['CS633Fall2023'] = [1, 3, 1, 2, 3, 10, 5, 1, 1, 1, 2, 3, 1, 1, 1, 1, 2, 1]
tech_chart_dict['CS633Spring2023'] = [2, 2, 3, 1, 1, 8, 6, 2, 2, 3, 2, 1, 1, 2, 1, 2, 1, 1]

learn_chart_dict ={}
learn_chart_category = ['Listening to the lectures',
                        'Re-review previous material and recordings',
                        'Completing assignments',
                        'Taking quizzes',
                        'Preparing for and completing the final exam',
                        'Providing/receiving comments to/from peers',
                        'Collaborating during the term project']
learn_chart_dict['CS633Fall2024'] = [66, 60, 68, 65, 62, 54, 73]
learn_chart_dict['CS633Fall2023'] = [64, 65, 62, 60, 65, 55, 65]
learn_chart_dict['CS633Spring2023'] =[60, 54, 73, 63, 68, 50, 83]


@app.route('/get_chart_data', methods=['POST'])
def get_chart_data():

    receive_data =  request.json
    type = receive_data.get('type')

    courses = [item for item in receive_data.get('course_list', []) if item in courses_list ]

    chart_data = {}

    if type == 'time_chart':
        #fetch Time and Score data dynamically from the database
        #time_chart_dict = fetchTimeScoreData()
        chart_data['category'] = []
        server_data = time_chart_data
    elif type == 'tech_chart':
        chart_data['category'] = tech_chart_category
        server_data = tech_chart_dict
    elif type == 'learn_chart':
        chart_data['category'] = learn_chart_category
        server_data = learn_chart_dict

    for course in courses:
        chart_data[course] = server_data[course]

    return jsonify(chart_data)

@app.route('/upload_file', methods=['POST'])
def upload_file():
    return jsonify({'message': 'upload success'})

@app.route('/get_course_list', methods=['GET'])
def get_course_list():
    return jsonify(courses_list)

@app.route('/remove_course', methods=['POST'])
def remove_course():
    list = request.json.get('list')

    for course in list:
        courses_list.remove(course)
    return jsonify({'message': 'remove success'})

if __name__ == '__main__':
    app.run(port=5000)
