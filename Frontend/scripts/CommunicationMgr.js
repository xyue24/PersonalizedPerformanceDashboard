// #region Dependent Function Import
import{
    RefreshCourseBtns,
    UpdateChart,
} from '/Frontend/scripts/ComponentMgr.js';
// #endregion

console.log('CommunicationMgr.js loaded');

// #region Communication APIs
const backend_url = '/api';
const upload_data_api = '/upload_data';
const delete_data_api = '/delete_data';
const get_doc_data_api = '/get_doc_data';
const get_doc_list_api = '/get_doc_list';

// database variables
export const global_variable = {
    selected_courses_list : [],
    available_courses_list : [],
    chart_type : 'Exam_Data',
    category_data : {'Exam_Data': [], 'Tech_Data': [],'Learn_Data': []},
    chart_data : {},
    statis_data : {}
}
// #endregion

// #region Communication Funcs
// Upload files to database ( the list of files )
export function UploadData(file_list){
    // Upload files to database
    fetch(backend_url+upload_data_api, {
        method: 'POST',
        body: file_list,
    })
    .then(response => response.json())  // get response from server

    // upload success
    .then(data => {     
        console.log('Upload Data Success: ', data);
        // request courses name list from server
        GetDocList(global_variable.chart_type);
    })

    // upload fail
    .catch(error => {   
        console.error('Upload Data Error: ', error);
    });
}

// Delete data from database ( collection id, list of document ids )
export function DeleteData(collection, documents){
    // package data
    const data_send = {
        type: collection,
        list: documents
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
        GetDocList(global_variable.chart_type);
    })
    .catch(error => {   // remove fail
        console.error('Delete Data Error: ', error);
    });
}

// Get document datas from database ( collection id, list of document ids )
export function GetDocData(collection, documents){
    // package data
    const data_send = {
        type: collection,
        list: documents
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
        global_variable.category_data[global_variable.chart_type] = data[0]['category'];
        global_variable.statis_data = data[0]['statis'];
        delete data[0].category;
        delete data[0].statis;
        global_variable.chart_data = data[0];
        UpdateChart();
    })

    // get fail
    .catch(error => {   
        console.error('Get Data Error: ', error);
    });
}

// Get Doc list from datase ( collection id )
export function GetDocList(collection){
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
        if(data.length != 0)
            global_variable.available_courses_list = data['list'].sort((a, b) => b.localeCompare(a));
        RefreshCourseBtns();
    })
    .catch(error => {   // get list fail
        console.error('Get List Error: ', error);
    });
}