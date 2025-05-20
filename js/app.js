const userInfo = localStorage.getItem('userInfo');
const userProfile = JSON.parse(userInfo);
const apiBaseUrl = 'https://chatroom-backend-jjoi.onrender.com';


$(document).ready(function () {
    validateToken();
    getfriendsRequestsCount();

    var connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiBaseUrl}/FriendNotificationHub`,{
            withCredentials: true
        })
        .withAutomaticReconnect()
        .build();

    connection.start().then(() => {
        console.log("SignalR Connected");

    }).catch(err => console.error(err.toString()));


    connection.on("ReceiveFriendRequest", function (message) {
        getfriendsRequestsCount();
    })

});

$('.profile').click(function () {
        window.location.href = 'profile.html';
    });
    $('.friends').click(function () {
        window.location.href = 'friends.html';
    });
    $('.chatroom').click(function () {
        window.location.href = 'chatroom.html';
    });

$('.signout').on('click', function () {
        Swal.fire({
            title: '確定要登出嗎？',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '確認',
            cancelButtonText: '取消',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${apiBaseUrl}/chatroom/User/logout`,
                    method: 'POST',
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function (response) {
                        if (response.code == 200 ) {
                            localStorage.removeItem('userInfo');
                            window.location.href = '/index.html';
                        }
                    },
                });
            }
        });
    });

function validateToken() {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/getProfile`,
        method: 'POST',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (!response.isValid) {
                localStorage.removeItem('userInfo');
                window.location.href = '/index.html';
            }
        },
        error: function () {
            localStorage.removeItem('userInfo');
            window.location.href = '/index.html';
        }
    });
}

function updateUserInfoField(fieldName, newValue, endpointUrl) {

    const data = {};
    data[fieldName] = newValue;

    $.ajax({
        url: endpointUrl,
        method: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(data),
        success: function (response) {
            let code = response.code;
            if (code == 200) {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    user[fieldName] = newValue;
                    localStorage.setItem('userInfo', JSON.stringify(user));

                    switch (fieldName) {
                        case 'displayName':
                            $('#userName').text(newValue);
                            break;
                        case 'email':
                            $('#userEmail').text(newValue);
                            break;
                        case 'displayId':
                            $('#userDisplayId').text(newValue);
                            break;
                    }
                }
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "更新成功",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
                $('.modal').modal('hide');

            } else if (code == 409 && fieldName == "DisplayId") {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "ID已經被使用過了",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
            } else if (code == 409 && fieldName == "Email") {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "Emai已經被使用過了",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    });
}

function getfriendsRequestsCount() {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/Friends/getFriendsRequests`,
        type: 'GET',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.code == 200) {
                let count = response.data.length;
                updateFriendRequestCount(count);

            }
        }
    })
}

function updateFriendRequestCount(count) {
    const $badge = $('#friend-request-count');
    const $menuBadge = $('.notification-count');
    const $notification = $('.notification-count');

    if (count > 0) {
        $badge.text(count).show();
        $menuBadge.text(count).show();
        $notification.text(count).show();
    } else {
        $badge.hide();
        $menuBadge.hide();
        $notification.hide();
    }
}