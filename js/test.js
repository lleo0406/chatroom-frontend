$(document).ready(function () {
    $.ajax({
        url: 'https://localhost:7080/chatroom/User/getUserInfo',
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        crossDomain: true,
        success: function (response) {

        },
    })
});