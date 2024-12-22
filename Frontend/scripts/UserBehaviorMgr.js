// #region Global Instances
// #region Database Variables
let selected_courses_list = [];
let available_courses_list = [];
let chart_type = 'Exam_Data';
let category_data = {'Exam_Data': [], 'Tech_Data': [],'Learn_Data': []};
let chart_data = {};
let statis_data = {};
let chart_dataset = [];
let admin = false;
let admin_password = "admin_password";
// #endregion 
// #region Communication APIs
const backend_url = '/api';
const upload_data_api = '/upload_data';
const delete_data_api = '/delete_data';
const get_doc_data_api = '/get_doc_data';
const get_doc_list_api = '/get_doc_list';
// #endregion
// #region Component Instances id
const course_btn_container = 'course_btn_container';
const chart_info_container = 'chart_info_container';
const course_loader = 'course_btn_wait';
const statis_loader = 'statis_info_wait';
let chart_canvas;
let chart = []
let curr_chart;
// #endregion
// #region Chart Plugins
const stopDrawingPlugin = {
    id: 'stopDrawing',
    afterDraw: (chart, args, options) => {
        DrawChartMean(chart);
        DrawChartMid(chart);
    }
};
// #endregion
// #region Chart Config
const time_chart_config = {     // config of time chart
    type: 'scatter',
    data: chart_dataset,
    options: {
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
        elements: { point: { radius: 7 }, line: { zIndex: 0 }},
        animation: { duration: 0 },
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
            },
        },
    },
    plugins: [stopDrawingPlugin]
}
const tech_chart_config = {     // config of tech chart
    type: 'bar',
    data: chart,
    options: {
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales:{
            x: {
                beginAtZero: true,
                grid: { display: true },
                title: { display: true, text: 'Number of time Techniques is adopted' },
                ticks: { stepSize: 5 },
                stacked: true
            },
            y: { stacked: true }
        },
        animation: { duration: 0 },
        plugins: {
            legend: { display: false, onClick: null },
            title: {
                display: true,
                text: 'Techniques Adopted',
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
        animation: { duration: 0 },
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
// #endregion

// #region User Behavior Functions
// User click upload file button
function ClickUploadBtn(){
    // verify admin user
    if(!admin){ AdminVerify(); }
    if(!admin){ return; }

    const file_input = document.getElementById('file-input');
    file_input.click();

    // handle selected files
    file_input.onchange = function(event) {

        DisplayComponent('course_btn_wait');

        ClickClearBtn();    // clear all course before upload

        const files = event.target.files; // get selected file
        if (files.length <= 0) { console.warn("AddCourseError: NoSelectedFile"); return; } // if no file exist, return

        const form_data = new FormData();
        for(let file of files){
            form_data.append('files', file);
        }
        
        // send file to server
        UploadData(form_data);
    };
}

// User click remove course button
function ClickRemoveBtn(){
    // verify admin user
    if(!admin){ AdminVerify(); }
    if(!admin){ return; }

    // user confirm remove action
    const user_confirmed = confirm("Sure you want to delete the selected courses?");
    if( !user_confirmed ){ return; }

    // remove course from frontend list and store into remove list
    const remove_list = selected_courses_list.filter(item => item != '');
    if(remove_list.length == 0){ return 0;}
    selected_courses_list = [];

    // Set loading message
    DisplayComponent('course_btn_wait');
    DisplayComponent('statis_info_wait');

    DeleteData(chart_type, remove_list);
    GetDocData(chart_type, selected_courses_list);
}

// User click Clear course button
function ClickClearBtn(){
    // Set loading message
    DisplayComponent('statis_info_wait');
    // Set all course buttons as deactive
    for(let course_id of selected_courses_list){
        if(course_id != ""){ DeactiveCourseBtn(course_id); }
    }
    selected_courses_list = [];                     // clear selected list

    GetDocData(chart_type, selected_courses_list);  // update course data
}

// User click a course button ( event button id )
function ClickCourseBtn(btn_id){
    // Preventing Invalid Input
    if(!available_courses_list.includes(btn_id)){
        console.log(`${btn_id} not in available list`);
        return 0;
    }
    DisplayComponent('statis_info_wait');
    // Click Unselected Course Button
    if(!selected_courses_list.includes(btn_id)){
        // Add data into slot
        let stored = false;
        for(let i = 0; i < selected_courses_list.length; i++){
            if(selected_courses_list[i] == ''){
                selected_courses_list[i] = btn_id;
                stored = true;
                break;
            } 
        }
        if( !stored ){ selected_courses_list.push(btn_id); }
        ActiveCourseBtn(btn_id, selected_courses_list.indexOf(btn_id));            // Set button as active  
    }
    // Click Selected Course Button
    else{
        // Remove data from Slot
        for(let i = 0; i < selected_courses_list.length; i++){
            if(selected_courses_list[i] == btn_id){
                selected_courses_list[i] = '';
            }    
        }
        DeactiveCourseBtn(btn_id);          // Set button as deactive
    }
    GetDocData(chart_type, selected_courses_list);
}

// User click a chart type button
function ClickChartBtn(type){
    // Input Validation Check
    if(chart_type == type){
        return;
    }
    // Set loading message
    DisplayComponent('statis_info_wait');
    DisplayComponent('course_btn_wait');
    // update button style
    ActiveChartBtn(type);               // Set clicked chart button as active
    DeactiveChartBtn(chart_type);       // Set previous chart button as deactive

    selected_courses_list = [];
    chart_type = type;  // update chart type

    GetDocList(chart_type);       // update course list
    GetDocData(chart_type, selected_courses_list);
}

// User click a create PDF button
function ClickCreatePDF(){
    DisplayComponent('download_wait');
    CreatePDF();
}
// #endregion

// #region General Action Groups
// refresh course buttons list
function RefreshCourseBtns(){
    let btn_container = document.getElementById('course_btn_container');              // find container
    btn_container.innerHTML = '';                                    // remove all course buttons 
    for(const course_id of available_courses_list){             // Create buttons for each course                 
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
function ActiveCourseBtn(btn_id, btn_index){
    // find button
    button = document.getElementById(btn_id);
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
function DeactiveCourseBtn(btn_id){
    // locate button
    button = document.getElementById(btn_id);
    // remove color object
    document.getElementById(btn_id+'color').remove();
    // swap its style
    button.classList.remove('clicked_course_btn'); 
    button.classList.add('course_btn'); 

    return 1;
}

// Set Chart Button as beclicked ( the id of chart button )
function ActiveChartBtn(chart_id){
    chart_btn = document.getElementById(chart_id)
    chart_btn.classList.remove('chart_type_btn'); 
    chart_btn.classList.add('clicked_chart_type_btn');
}

// Set Chart Button as non-clicked ( the id of chart button )
function DeactiveChartBtn(chart_id){
    chart_btn = document.getElementById(chart_id)
    chart_btn.classList.remove('clicked_chart_type_btn'); 
    chart_btn.classList.add('chart_type_btn');
}

// Display the target loading page (target component, display style = 'flex')
function DisplayComponent(component_id, load_display = 'flex'){
    document.getElementById(component_id).style.display = load_display;
}

// Hide the target loading page (target component)
function HideComponent(component_id){
    document.getElementById(component_id).style.display = 'none';
}
// #endregion

// #region Charts
function UpdateChart(){
    if(curr_chart){ curr_chart.destroy(); }

    chart_canvas = document.getElementById('chart_canvas').getContext('2d'); 
    chart_dataset = [];

    let item_data = {}
    for(let item in chart_data){
        item_data = {
            label: item,
            // Correspond each y-value in the list to an x-value
            data: chart_data[item],
            backgroundColor: document.getElementById(item+'color').textContent,
            zIndex: 1
        }
        chart_dataset.push(item_data);
    }

    if(chart_type == 'Exam_Data'){
        DisplayTimeChart(chart_canvas);
    }
    else if(chart_type == 'Tech_Data'){
        DisplayTechChart(chart_canvas);
    }
    else if(chart_type == 'Learn_Data'){
        DisplayLearnChart(chart_canvas);
    }
    else{
        console.error('Update Chart Error: Unknown Chart Type');
    }
    DisplayStatis();
    HideComponent(statis_loader);
}

function DisplayTimeChart(chart_canvas){
    time_chart_config.data.datasets = chart_dataset;
    curr_chart = new Chart(chart_canvas, time_chart_config);
}

function DisplayTechChart(chart_canvas){
    tech_chart_config.data.labels = category_data[chart_type];
    tech_chart_config.data.datasets = chart_dataset;
    curr_chart = new Chart(chart_canvas, tech_chart_config);
}

function DisplayLearnChart(chart_canvas){
    learn_chart_config.data.labels = category_data[chart_type];
    learn_chart_config.data.datasets = chart_dataset;
    curr_chart = new Chart(chart_canvas, learn_chart_config);
}

function DisplayStatis(){
    // clear container
    const statis_container = document.getElementById('chart_info_container');
    statis_container.innerHTML = '';

    // loop through list
    for(const key in statis_data){
        const new_box = document.createElement('div')       // create new div
        statis_container.appendChild(new_box);              // add into container
        new_box.id = key;                     // set button id
        new_box.className = 'chart_info';                   // set button class
        if(key == 'Q2(Expected Behavior)' ||key == 'Q1(Genius)' ||key == 'Q3(Over-Confident)' ||key == 'Q4(Need External Help)')
        {
            new_box.textContent = key+" : \n"+statis_data[key];
        }
        else
        {
            new_box.textContent = key+" : "+statis_data[key];               // set button text  
        }            
    }
}

function DrawChartMean(curr_chart){
    const ctx  = curr_chart.ctx;
    if(ctx == undefined){ return; }
    const x_scale = curr_chart.scales.x;
    const y_scale = curr_chart.scales.y;

    // Line style
    ctx.save();
    ctx.setLineDash([5, 5]); // set line style（ length，interval）
    ctx.strokeStyle = '#b9b9b9'; // set color
    ctx.lineWidth = 1;          // set width

    // Convert statis into pix pos
    let x_pixel = x_scale.getPixelForValue(0);
    let y_pixel = y_scale.getPixelForValue(0);
    x_pixel = ( x_scale.left + x_scale.right ) / 2;
    y_pixel = ( y_scale.top + y_scale.bottom )  / 2;

    // draw vertical-line
    ctx.beginPath();
    ctx.moveTo(x_pixel, y_scale.top);
    ctx.lineTo(x_pixel, y_scale.bottom);
    ctx.stroke();

    //  draw herizonal-line
    ctx.beginPath();
    ctx.moveTo(x_scale.left, y_pixel);
    ctx.lineTo(x_scale.right, y_pixel);
    ctx.stroke();

    ctx.restore();
}

function DrawChartMid(curr_chart){
    const ctx = curr_chart.ctx;
    if(ctx == undefined){ return; }
    const x_scale = curr_chart.scales.x;
    const y_scale = curr_chart.scales.y;

    // Line style
    ctx.save();
    ctx.setLineDash([5, 5]); // set line style（ length，interval）
    ctx.strokeStyle = '#757575'; // set color
    ctx.lineWidth = 1;       // set width

    // Convert statis into pix pos
    let x_pixel = x_scale.getPixelForValue(0);
    let y_pixel = y_scale.getPixelForValue(0);
    if('Time Mean' in statis_data){ x_pixel = x_scale.getPixelForValue(statis_data['Time Mean']); }
    if('Score Mean' in statis_data){ y_pixel = y_scale.getPixelForValue(statis_data['Score Mean']); }

    // draw vertical-line
    ctx.beginPath();
    ctx.moveTo(x_pixel, y_scale.top);
    ctx.lineTo(x_pixel, y_scale.bottom);
    ctx.stroke();

    //  draw herizonal-line
    ctx.beginPath();
    ctx.moveTo(x_scale.left, y_pixel);
    ctx.lineTo(x_scale.right, y_pixel);
    ctx.stroke();

    ctx.restore();
}
// #endregion

// #region Communication Funcs
// Upload files to database ( the list of files )
function UploadData(file_list){
    // Upload files to database
    fetch(backend_url+upload_data_api, {
        method: 'POST',
        body: file_list
    })
    .then(response => response.json())  // get response from server

    // upload success
    .then(data => {     
        console.log('Upload Data Success: ', data);
        // request courses name list from server
        GetDocList(chart_type);
    })

    // upload fail
    .catch(error => {   
        console.error('Upload Data Error: ', error);
    });
}

// Delete data from database ( collection id, list of document ids )
function DeleteData(collection, documents){
    // package data
    const data_send = {
        type: collection,
        list: documents.filter(item => item != "")
    }
    // send list to backend to delete course key
    fetch(backend_url+delete_data_api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data_send),
    })
    .then(response => response.json())  // get response from server

    // delete success
    .then(data => {     
        // request courses name list from server
        console.log('Delete Data Success: ', data);
        GetDocList(chart_type);
    })
    .catch(error => {   // remove fail
        console.error('Delete Data Error: ', error);
    });
}

// Get document datas from database ( collection id, list of document ids )
function GetDocData(collection, documents){
    // package data
    const data_send = {
        type: collection,
        list: documents.filter(item => item != "")
    }
    // send to server
    fetch(backend_url+get_doc_data_api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data_send)
    })
    .then(response => response.json())  // get response from server
    
    // get success
    .then(data => {     
        console.log('Get Data Success: ', data);
        category_data[chart_type] = data[0]['category'];
        statis_data = data[0]['statis'];
        chart_data = {}
        for(let key in data[0]){
            if(key != 'category' && key != 'statis')
                chart_data[key] = data[0][key]
        }
        UpdateChart();
    })

    // get fail
    .catch(error => {   
        console.error('Get Data Error: ', error);
    });
}

// Get Doc list from datase ( collection id )
function GetDocList(collection){
    const data = {
        type: collection
    }
    fetch(backend_url + get_doc_list_api,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response =>  response.json())
    .then(data => {     // get course name list
        // get list and refresh course btns
        console.log('Get List Success: ', data);
        // Sort and set Courses
        available_courses_list = data.sort((a, b) => b.localeCompare(a));
        RefreshCourseBtns();
    })
    .catch(error => {   // get list fail
        console.error('Get List Error: ', error);
    });
}
// #endregion

// #region Support Functions
// Generate a color (the index of color)
function GetColor(index){
    // set function parameters
    const color_zone = 6;     // devide all color into blocks
    const bright_zone = 3;     // pick number of color in each color zone
    const start_value = 60;    // color start from what brightness
    // generate a hwb color text
    const hwb_h = index % color_zone * (360 / color_zone);
    const hwb_b = (Math.floor(index / color_zone) * ( start_value / (bright_zone-1) )) / 100;
    const hwb_w = (start_value / 100 - hwb_b);

    // get info for converting
    const temp_c = 1 - hwb_w - hwb_b;
    const temp_x = temp_c * (1 - Math.abs((hwb_h / 60) % 2 - 1));
    const temp_m = hwb_w;
    // convert hbw into rbg
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

function CreatePDF(){
    // create file
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: "landscape"
    });
    // regist component
    const chart = document.getElementById("chart_canvas");
    const statis = document.getElementById("chart_info_container").querySelectorAll('div');
    
    // get text from statis component
    let y_pos = 22;
    let y_gap = 15;
    let x_pos = 245;
    let i = 0;
    for(const key in statis_data)
    {
        pdf.setFontSize(12);
        pdf.setFont("Arial", "bold");
        pdf.text(key+"\n", x_pos, y_pos+y_gap*(i));

        pdf.setFontSize(12);
        pdf.setFont("Arial", "normal");
        pdf.text(statis_data[key].toString(), x_pos, y_pos+y_gap*(i)+5);

        i ++;
    }

    // adjust component
    time_chart_config.options.plugins.legend.display = true;
    tech_chart_config.options.plugins.legend.display = true;
    learn_chart_config.options.plugins.legend.display = true;
    UpdateChart();

    // create img (wait component adjustment finish)
    const chart_img = chart.toDataURL("image/png");
    
    // set component back
    time_chart_config.options.plugins.legend.display = false;
    tech_chart_config.options.plugins.legend.display = false;
    learn_chart_config.options.plugins.legend.display = false;
    UpdateChart();

    // add into pdf
    if(chart_type == 'Exam_Data')
    {
        pdf.addImage(chart_img, "PNG", 5, 20, 230, 155);
    }
    else
    {
        pdf.addImage(chart_img, "PNG", 5, 20, 290, 180);
    }

    // start downloading
    pdf.save(chart_type+" Report.pdf");

    HideComponent('download_wait');
}

function AdminVerify(){
    const user_input = prompt("Please input admin password: ", "password");
    if(user_input == admin_password){
        admin = true;
    }
    else{
        confirm("Wrong Password");
    }
}

// Initial Script
function ScriptInitial(){
    HideComponent('download_wait');
    GetDocList('Exam_Data');
    GetDocData('Exam_Data', []); 
}
window.onload = ScriptInitial;
// #endregion
