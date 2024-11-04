from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

courses_list = ['CS633Fall2024', 'CS633Fall2023', 'CS633Spring2023']

time_chart_dict = {}
time_chart_dict['CS633Fall2024']    = [{'x': 180, 'y': 84.61 }, {'x': 162, 'y': 94.81 }, {'x': 178, 'y': 91.91}]
time_chart_dict['CS633Fall2024']    = [{'x': 179, 'y': 89.41 }, {'x': 178, 'y': 96.99 }, {'x': 180, 'y': 88.26}]
time_chart_dict['CS633Fall2024']    = [{'x': 177, 'y': 86.04 }, {'x': 179, 'y': 86.04 }, {'x': 180, 'y': 86.97}]

tech_chart_dict = {}
learn_chart_dict ={}

@app.route('/get_chart_data', methods=['POST'])
def get_chart_data():

    receive_data =  request.json
    type = receive_data.get('type')
    courses = receive_data.get('course_list', [])

    chart_data = {}

    if type == 'time_chart':
        server_data = time_chart_dict
    elif type == 'tech_chart':
        server_data = tech_chart_dict
    elif type == 'learn_chart':
        server_data = learn_chart_dict    

    for course in courses:
        chart_data[course] = server_data[course]

    return jsonify(chart_data)

@app.route('/upload_file', methods=['POST'])
def upload_file():
    return jsonify({'message': '文件上传成功'})

@app.route('/get_course_list', methods=['GET'])
def get_course_list():
    return jsonify(courses_list)

@app.route('/remove_course', methods=['POST'])
def remove_course():
    list = request.json.get('list')

    for course in list:
        courses_list.remove(course)
    return jsonify({'message': '文件删除成功'})

if __name__ == '__main__':
    app.run(port=5000)