/*
Name:           MainPageScript.js
Description:    Script file for the MainPage.html
Author:         Xiaoyue Zhang
Version:        v0.6.202411061
*/

// #region Instance Initial
// database data
const backend_url = 'http://127.0.0.1:5000';
const upload_file_api = '/upload_files';
const remove_course_api = '/remove_course';
const get_course_list_api = '/get_course_list';
const get_chart_data_api = '/get_chart_data';

let chart_canvas;

let course_data_dict = new Map();
let selected_courses_list = [];
let available_courses_list = [];
let chart_value = [];

// variable initial
let course = '';
let chart_type = 'time_chart';

// chart config initial
let curr_chart;
let tech_chart_category = []
let learn_chart_category = []
let chart_data = [];
const time_chart_config = {     // config of time chart
    type: 'scatter',
    data: chart_data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales:{
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Time'  
                },
                grid: {
                    display: true
                },
                ticks: {
                    stepSize: 1
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Score'  
                },
                grid: {
                    display: true
                },
                ticks: {
                    stepSize: 1
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
}
const tech_chart_config = {     // config of tech chart
    type: 'bar',
    data: chart_data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales:{
            x: {
                beginAtZero: true,
                grid: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Number'  
                },
                ticks: {
                    stepSize: 1
                },
                stacked: true
            },
            y: {
                stacked: true
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
}
const learn_chart_config = {    // config of learn chart
    type: 'bar',
    data: chart_data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales:{
            x: {
                beginAtZero: true,
                grid: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Score'  
                },
                ticks: {
                    stepSize: 1
                },
                stacked: true
            },
            y: {
                stacked: true
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
}
// #endregion

// #region Web Element Event Functions
// refresh course btns list (complete)
function RefreshCourseBtn(){
    // clear container
    const course_btn_container = document.getElementById('course_btn_container');
    course_btn_container.innerHTML = '';

    // loop through list
    available_courses_list.forEach(course_text => {
        const new_btn = document.createElement('button')        // create new button
        course_btn_container.appendChild(new_btn);              // add into container
        new_btn.id = course_text;                               // set button id
        new_btn.className = 'course_btn';                       // set button class
        new_btn.textContent = course_text;                      // set button text   
        // add button event
        new_btn.addEventListener('click', (function(param) {
            return function() {
                ClickCourseBtn(param);
            };
        })(course_text));  
    })
}

// click course btn
function ClickCourseBtn(btn_id){
    // invalid input check
    if(!available_courses_list.includes(btn_id)){
        console.log(`${btn_id} not in available list`);
        return;
    }

    const target_btn = document.getElementById(btn_id); // get clicked button
    course = btn_id;

    // remove course if exist, add course if not exist
    if(selected_courses_list.includes(btn_id)){   // check if contain course
        // remove color object
        document.getElementById(btn_id+'color').remove();
        
        // remove data from list
        for(let i = 0; i < selected_courses_list.length; i++){
            if(selected_courses_list[i] == btn_id){
                selected_courses_list[i] = '';
            }    
        }

        course_data_dict.delete(btn_id);
        UpdateChart();
    }
    else{
        // store course id into list
        let stored = false;
        for(let i = 0; i < selected_courses_list.length; i++){
            if(selected_courses_list[i] == ''){
                selected_courses_list[i] = btn_id;
                stored = true;
                break;
            } 
        }
        if( !stored ){ selected_courses_list.push(btn_id); }

        // add color object
        let new_color = document.createElement('div');                      // create new color object
        let color_text = GetColor(selected_courses_list.indexOf(btn_id));   // get a random color for this course

        target_btn.appendChild(new_color);                                  // add into container

        new_color.className = 'course_btn_color';                           // set button class
        new_color.id = target_btn.id + 'color';                             // set div id
        new_color.textContent = color_text;                                 // set div text
        new_color.style.backgroundColor = color_text;                       // set color 

        const data_send = {
            type: chart_type,
            course_list: [course]
        };
        GetChartData(JSON.stringify(data_send));
    }
}    

// click chart type button (complete)
function ClickChartBtn(type){
    if(chart_type == type){
        return;
    }
    // update button style
    const prev_btn = document.getElementById(chart_type);
    const new_btn =  document.getElementById(type);

    prev_btn.classList.remove('clicked_chart_type_btn'); 
    prev_btn.classList.add('chart_type_btn'); 
    new_btn.classList.remove('chart_type_btn'); 
    new_btn.classList.add('clicked_chart_type_btn');

    // set chart type nad update chart
    chart_type = type;

    ClearSelection();
    GetCourseList();

    const data_send = {
        type: chart_type,
        course_list: [course]
    };
    GetChartData(JSON.stringify(data_send));   
}

// upload file to server (complete)
function AddCourse(){
    // open file selection page
    const file_input = document.getElementById('file-input');
    file_input.click()

    // handle selected files
    file_input.onchange = function(event) {
        const files = event.target.files; // get selected file
        if (files.length <= 0) { console.warn("AddCourseError: NoSelectedFile"); return; } // if no file exist, return

        const form_data = new FormData();
        for(let file of files){
            form_data.append('files', file);
        }
        
        // send file to server
        UploadFile(form_data);
    };
}

// clear selection (complete)
function ClearSelection(){
    for(let i = 0; i < selected_courses_list.length; i ++){
        ClickCourseBtn(selected_courses_list[i]);
    }
    selected_courses_list = [];
    course_data_dict.clear();

    UpdateChart();
}
// #endregion

// #region Server Communication Functions
// upload file to backend server (complete)
function UploadFile(file){
    fetch(backend_url+upload_file_api, {
        method: 'POST',
        body: file,
    })
    .then(response => response.json())  // get response from server
    .then(data => {     // upload success

        console.log('Upload File Success: ', data);
        // request courses name list from server
        GetCourseList();
    })
    .catch(error => {   // upload fail
        console.error('Upload File Error: ', error);
    });
}

// remove selected courses (complete)
function RemoveCourse(){
    // user confirm remove action
    const user_confirmed = confirm("Sure you want to delete the selected courses?");
    if( !user_confirmed ){ return; }

    // remove course from frontend list and store into remove list
    let remove_list = [];
    for(let i = 0; i < selected_courses_list.length; i ++){
        if(selected_courses_list[i] != ""){   
            remove_list.push(selected_courses_list[i]);
            course_data_dict.delete(selected_courses_list[i]);
        }
    }

    if(remove_list.length == 0){ return; }

    const data_send = {
        type: chart_type,
        list: remove_list
    }
    // send list to backend to delete course key
    fetch(backend_url+remove_course_api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data_send),
    })
    .then(response => response.json())  // get response from server
    .then(data => {     // remove success
        // request courses name list from server
        GetCourseList();
    })
    .catch(error => {   // remove fail
        console.error('Remove Course Error: ', error);
        GetCourseList();
    });
}

// add one single data into dict
function GetChartData(data_string){
    // send to server
    fetch(backend_url+get_chart_data_api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data_string,
    })
    .then(response => response.json())  // get response from server
    .then(data => {     // get success
        for(let item in data){
            if(chart_type == "learn_chart" )
                learn_chart_category = data['category']
            else if(chart_type == "tech_chart")
                tech_chart_category = data['category']
            if(item == 'category'){ continue; }
            course_data_dict.set(item, data[item]);
        }
        UpdateChart();
    })
    .catch(error => {   // get fail
        console.error('GetChartError: ', error);
        UpdateChart();
    });
}

// update chart by data in dict
function UpdateChart(){

    if(chart_type == 'time_chart'){
        DisplayTimeChart();
    }
    else if(chart_type == 'tech_chart'){
        DisplayTechChart();
    }
    else if(chart_type == 'learn_chart'){
        DisplayLearnChart();
    }
    else{
        console.error('Update Chart Error: Unknown Chart Type');
    }
}

// get course list from server (complete)
function GetCourseList(){
    const data = {
        type: chart_type
    }
    fetch(backend_url + get_course_list_api,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response =>  response.json())
    .then(data => {     // get course name list
        // get list and refresh course btns
        available_courses_list = data['list'].sort((a, b) => b.localeCompare(a));
        ClearSelection();
        RefreshCourseBtn();
    })
    .catch(error => {   // get list fail
        console.error('Get Course List Error: ', error);
    });
} 
// #endregion

// #region Chart Display Functions
// display time vs score chart
function DisplayTimeChart(){
    if(curr_chart){ curr_chart.destroy(); }
    chart_data = [];

    let item_data = {}

    for(let item of course_data_dict){
        item_data = {
            label: item[0],
            data: item[1],
            backgroundColor: HwbToRgb(document.getElementById(item[0]+'color').textContent),
            pointRadius: 5
        }
        chart_data.push(item_data);
    }
    time_chart_config.data.datasets = chart_data;
    curr_chart = new Chart(chart_canvas, time_chart_config);
}

function DisplayTechChart(){
    if(curr_chart){ curr_chart.destroy(); }
    chart_data = [];
    let item_data = {}

    tech_chart_config.data.labels = tech_chart_category;

    for(let item of course_data_dict){

        item_data = {
            label: item[0],
            data: item[1],
            backgroundColor: HwbToRgb(document.getElementById(item[0]+'color').textContent),
            pointRadius: 5
        }
        chart_data.push(item_data);
    }
    tech_chart_config.data.datasets = chart_data;
    curr_chart = new Chart(chart_canvas, tech_chart_config);
}

function DisplayLearnChart(){
    if(curr_chart){ curr_chart.destroy(); }
    chart_data = [];
    let item_data = {}

    learn_chart_config.data.labels = learn_chart_category;

    for(let item of course_data_dict){

        item_data = {
            label: item[0],
            data: item[1],
            backgroundColor: HwbToRgb(document.getElementById(item[0]+'color').textContent),
            pointRadius: 5
        }
        chart_data.push(item_data);
    }
    learn_chart_config.data.datasets = chart_data;
    curr_chart = new Chart(chart_canvas, learn_chart_config);
}
// #endregion

// #region Support Functions
// calculate a suitable colors (complete)
function GetColor(index) {
    
    let hwb_h = index % 12 * 30;
    let hwb_w = Math.floor(index / 3) * 30;
    let hwb_b = 60 - hwb_w

    return `hwb(${hwb_h} ${hwb_b}% ${hwb_w}%)`;
}

// convert hwb to rgb
function HwbToRgb(hwb_string) {  
    const cleanedString = hwb_string.trim().replace(/^hwb\(/, '').replace(/\)$/, '');
    const values = cleanedString.split(/\s*,\s*|\s+/);

    const hwb_h = parseFloat(values[0]);
    const hwb_w = parseFloat(values[1]) / 100;
    const hwb_b = parseFloat(values[2]) / 100;

    const temp_c = 1 - hwb_w - hwb_b;
    const temp_x = temp_c * (1 - Math.abs((hwb_h / 60) % 2 - 1));
    const temp_m = hwb_w;

    let rgb_r, rgb_g, rgb_b;

    // set rgb base on H value
    if      (hwb_h >= 0   && hwb_h < 60)  { rgb_r = temp_c; rgb_g = temp_x; rgb_b = 0; } 
    else if (hwb_h >= 60  && hwb_h < 120) { rgb_r = temp_x; rgb_g = temp_c; rgb_b = 0; } 
    else if (hwb_h >= 120 && hwb_h < 180) { rgb_r = 0;      rgb_g = temp_c; rgb_b = temp_x; } 
    else if (hwb_h >= 180 && hwb_h < 240) { rgb_r = 0;      rgb_g = temp_x; rgb_b = temp_c; } 
    else if (hwb_h >= 240 && hwb_h < 300) { rgb_r = temp_x; rgb_g = 0;      rgb_b = temp_c; } 
    else                                  { rgb_r = temp_c; rgb_g = 0;      rgb_b = temp_x; }

    // convert into 0-255 RGB
    rgb_r = Math.round((rgb_r + temp_m) * 255);
    rgb_g = Math.round((rgb_g + temp_m) * 255);
    rgb_b = Math.round((rgb_b + temp_m) * 255);

    // transparent default = 1
    const rgb_a = 1;

    // return RGBA
    return `rgba(${rgb_r}, ${rgb_g}, ${rgb_b}, ${rgb_a})`;
}

// initial script onload
function ScriptInitial(){
    GetCourseList();
    chart_canvas = document.getElementById('chart_canvas').getContext('2d');
    UpdateChart();
}
// #endregion

window.onload = ScriptInitial;