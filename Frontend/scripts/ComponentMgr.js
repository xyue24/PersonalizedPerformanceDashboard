// #region Dependent Function & Variable Import
import {
    ClickCourseBtn,
    GetElement
} from '/Frontend/scripts/UserBehaviorMgr.js'
import{
    global_variable
} from '/Frontend/scripts/CommunicationMgr.js';
// #endregion

console.log('ComponentMgr.js loaded');

// #region Component Instances id
const course_btn_container = 'course_btn_container';
const chart_info_container = 'chart_info_container';
const course_loader = 'course_btn_wait';
const statis_loader = 'statis_info_wait';
let chart_canvas;
let chart = []
let curr_chart;

// #endregion

// #region Chart Config
const time_chart_config = {     // config of time chart
    type: 'scatter',
    data: chart,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales:{
            x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'Time in minutes' },
                grid: { display: true },
                ticks: { stepSize: 10 }
            },
            y: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Score' },
                grid: { display: true },
                ticks: { stepSize: 5 }
            }
        },
        elements: { point: { radius: 7 }},
        // reflect data label as x and y
        parsing: { xAxisKey: 'Time', yAxisKey: 'Score' },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Score vs Time',
                position: 'top',  // 'top', 'left', 'bottom', 'right'
                align: 'center',  // 'center', 'start', 'end'
                padding: { top: 0, bottom: 0 },
                font: { size: 18, family: 'Arial, sans-serif', weight: 'bold', lineHeight: 1 },
                color: '#000000'
            }
        }
    }
}
const tech_chart_config = {     // config of tech chart
    type: 'bar',
    data: chart,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales:{
            x: {
                beginAtZero: true,
                grid: { display: true },
                title: { display: true, text: 'Number' },
                ticks: { stepSize: 5 },
                stacked: true
            },
            y: { stacked: true }
        },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Technologies Adopted',
                position: 'top',  // 'top', 'left', 'bottom', 'right'
                align: 'center',  // 'center', 'start', 'end'
                padding: { top: 0, bottom: 0 },
                font: { size: 18, family: 'Arial, sans-serif', weight: 'bold', lineHeight: 1 },
                color: '#000000'
            }
        }
    }
}
const learn_chart_config = {    // config of learn chart
    type: 'bar',
    data: chart,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales:{
            x: {
                beginAtZero: true,
                grid: { display: true },
                title: { display: true, text: 'Score'},
                ticks: { stepSize: 5 },
                stacked: true
            },
            y: {
                stacked: true
            }
        },
        plugins: {
            legend: {
                display: false
            },
            title: { 
                display: true, 
                text: 'Learning Methods',
                position: 'top',  // 'top', 'left', 'bottom', 'right'
                align: 'center',  // 'center', 'start', 'end'
                padding: { top: 0, bottom: 0 },
                font: { size: 18, family: 'Arial, sans-serif', weight: 'bold', lineHeight: 1 },
                color: '#000000'
            }
        }
    }
}
// #endregion

// #region General Action Groups

// #region Course Buttons
// refresh course buttons list
export function RefreshCourseBtns(){
    let btn_container = GetElement('course_btn_container');              // find container
    btn_container.innerHTML = '';                                    // remove all course buttons 
    for(const course_id of global_variable.available_courses_list){             // Create buttons for each course                 
        const new_btn = document.createElement('button');       // create new button
        btn_container.appendChild(new_btn);                         // append button to container
        new_btn.id = course_id;                                 // set button id
        new_btn.className = 'course_btn';                       // set button class
        new_btn.textContent = course_id;                        // set button text 
        new_btn.addEventListener('click', (function(param) {    // add button event
            return function() {
                ClickCourseBtn(param);
            };
        })(course_id));                                         // use course id as event parameter
    }
    HideComponent(course_loader);
    return 1;
}

// Set Course Button as active ( the id of course button )
export function ActiveCourseBtn(btn_id, btn_index){
    // find button
    button = GetElement(btn_id);
    // set btn style
    button.classList.remove('course_btn'); 
    button.classList.add('clicked_course_btn'); 
    // add color object
    let new_color = document.createElement('div');                      // create new color object
    button.appendChild(new_color);                                      // add into container
    new_color.className = 'course_btn_color';                           // set button class
    new_color.id = btn_id + 'color';                                    // set div id

    let color_text = GetColor(btn_index);                               // get a color for this course
    new_color.textContent = color_text;                                 // set div text
    new_color.style.backgroundColor = color_text;                       // set color 

    return 1;
}

// Set Course Button as disactive ( the id of course button )
export function DeactiveCourseBtn(btn_id){
    // locate button
    button = GetElement(btn_id);
    // remove color object
    GetElement(btn_id+'color').remove();;
    // swap its style
    button.classList.remove('clicked_course_btn'); 
    button.classList.add('course_btn'); 

    return 1;
}
// #endregion

// #region Chart Buttons
// Set Chart Button as beclicked ( the id of chart button )
export function ActiveChartBtn(chart_id){
    chart_btn = GetElement(chart_id)
    chart_btn.classList.remove('chart_type_btn'); 
    chart_btn.classList.add('clicked_chart_type_btn');
}

// Set Chart Button as non-clicked ( the id of chart button )
export function DeactiveChartBtn(chart_id){
    chart_btn = GetElement(chart_id)
    chart_btn.classList.remove('clicked_chart_type_btn'); 
    chart_btn.classList.add('chart_type_btn');
}
// #endregion

// #region Charts
export function UpdateChart(){
    if(curr_chart){ curr_chart.destroy(); }

    if(global_variable.chart_type == 'Exam_Data'){
        DisplayTimeChart();
    }
    else if(global_variable.chart_type == 'Tech_Data'){
        DisplayTechChart();
    }
    else if(global_variable.chart_type == 'Learn_Data'){
        DisplayLearnChart();
    }
    else{
        console.error('Update Chart Error: Unknown Chart Type');
    }
    DisplayStatis();
    HideComponent(statis_loader);
}

function DisplayTimeChart(){
    chart_canvas = GetElement('chart_canvas').getContext('2d'); 
    chart = [];

    let item_data = {}

    if(Object.keys(global_variable.chart_data).length != 0){
        for(let item of global_variable.chart_data){
            item_data = {
                label: item[0],
                // Correspond each y-value in the list to an x-value
                data: item[1],
                backgroundColor: GetElement(item[0]+'color').textContent,
            }
            chart.push(item_data);
        }
    }
    time_chart_config.data.datasets = chart;
    curr_chart = new Chart(chart_canvas, time_chart_config);
}

function DisplayTechChart(){
    chart_canvas = GetElement('chart_canvas').getContext('2d'); 
    chart = [];
    
    let item_data = {}

    tech_chart_config.data.labels = category_data[chart_type];
    if(Object.keys(global_variable.chart_data).length != 0){
        for(let item of global_variable.chart_data){

            item_data = {
                label: item[0],
                data: item[1],
                backgroundColor: GetElement(item[0]+'color').textContent,
            }
            chart.push(item_data);
        }
    }
    tech_chart_config.data.datasets = chart;
    curr_chart = new Chart(chart_canvas, tech_chart_config);
}

function DisplayLearnChart(){
    chart_canvas = GetElement('chart_canvas').getContext('2d'); 
    chart = [];

    let item_data = {}

    learn_chart_config.data.labels = category_data[chart_type];
    if(Object.keys(global_variable.chart_data).length != 0){
        for(let item of global_variable.chart_data){

            item_data = {
                label: item[0],
                data: item[1],
                backgroundColor: GetElement(item[0]+'color').textContent,
            }
            chart.push(item_data);
        }
    }
    learn_chart_config.data.datasets = chart;
    curr_chart = new Chart(chart_canvas, learn_chart_config);
}

function DisplayStatis(){
    // clear container
    const statis_container = document.getElementById('chart_info_container');
    statis_container.innerHTML = '';

    // loop through list
    for(const key in global_variable.statis_data){
        const new_box = document.createElement('div')       // create new div
        statis_container.appendChild(new_box);              // add into container
        new_box.id = key;                     // set button id
        new_box.className = 'chart_info';                   // set button class
        new_box.textContent = key+" : "+global_variable.statis_data[key];               // set button text                      
    }
}

// #endregion


// #region Modified Component Functions

// #endregion

// #region Loading Page
// Display the target loading page (target component, display style = 'flex')
export function DisplayComponent(component_id, load_display = 'flex'){
    GetElement(component_id).style.display = load_display;
}

// Hide the target loading page (target component)
export function HideComponent(component_id){
    GetElement(component_id).style.display = 'none';
}
// #endregion

// #endregion

// #region Basic Support Functions 

// Generate a color (the index of color)
function GetColor(index_in_list){
    // set function parameters
    const color_zone = 12;     // devide all color into blocks
    const bright_zone = 3;     // pick number of color in each color zone
    const start_value = 60;    // color start from what brightness

    // generate a hwb color text
    const hwb_h = index % color_zone * (360 / color_zone);
    const hwb_w = (Math.floor(index / bright_zone) * ( 60 / (bright_zone-1) ) ) / 100;
    const hwb_b = (start_value - hwb_w) / 100

    // get info for converting
    const temp_c = 1 - hwb_w - hwb_b;
    const temp_x = temp_c * (1 - Math.abs((hwb_h / 60) % 2 - 1));
    const temp_m = hwb_w;

    // convert hwb into rbg
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
// #endregion