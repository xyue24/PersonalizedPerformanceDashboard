from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

courses_list = ['CS633Fall2024', 'CS633Fall2023', 'CS633Spring2023']

time_chart_dict = {}
time_chart_dict['CS633Fall2024']   = [{'x': 180, 'y': 84.61 }, {'x': 162, 'y': 94.81 }, {'x': 178, 'y': 91.91}]
time_chart_dict['CS633Fall2023']   = [{'x': 179, 'y': 89.41 }, {'x': 178, 'y': 96.99 }, {'x': 180, 'y': 88.26}]
time_chart_dict['CS633Spring2023'] = [{'x': 177, 'y': 86.04 }, {'x': 179, 'y': 86.04 }, {'x': 180, 'y': 86.97}]

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
        chart_data['category'] = []
        server_data = time_chart_dict
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