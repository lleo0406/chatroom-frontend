$(document).ready(function () {
    const $toggle = $('#menuToggle');
    const $menu = $('#dropdownMenu');

    $toggle.on('click', function (e) {
        e.stopPropagation();
        $menu.toggle();
    });

    $(document).on('click', function () {
        $menu.hide();
    });

    getFriendsList();

});

$('#friends-requests').on('click', function () {
    getfriendsRequests();
});

$('#friend-request-list').on('click', '.accept-request', function () {
    const requesterId = $(this).data('id');

    const displayName = $(this)
        .closest('.d-flex.align-items-center.mb-3.justify-content-between')
        .find('.font-weight-bold')
        .text()
        .trim();

    Swal.fire({
        title: `確定接受 ${displayName} 的邀請？`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: 'https://localhost:7080/chatroom/Friends/acceptFriend',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ Id: requesterId }),
                xhrFields: {
                    withCredentials: true
                },
                success: function (response) {
                    if (response.code == 200) {
                        window.location.reload();
                    } else {
                        Swal.fire({
                            title: '操作失敗',
                            text: response.message || '系統發生錯誤，請稍後再試。',
                            icon: 'error',
                            confirmButtonText: '確定'
                        });
                    }
                }
            })
        }
    });
});

$('#friend-request-list').on('click', '.reject-request', function () {
    const requesterId = $(this).data('id');

    const displayName = $(this)
        .closest('.d-flex.align-items-center.mb-3.justify-content-between')
        .find('.font-weight-bold')
        .text()
        .trim();

    Swal.fire({
        title: `確定拒絕 ${displayName} 的邀請？`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: 'https://localhost:7080/chatroom/Friends/rejectFriend',
                type: 'POST',
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify({ Id: requesterId }),
                success: function (response) {
                    if (response.code == 200) {
                        window.location.reload();
                    } else {
                        Swal.fire({
                            title: '操作失敗',
                            text: response.message || '系統發生錯誤，請稍後再試。',
                            icon: 'error',
                            confirmButtonText: '確定'
                        });
                    }
                }
            })
        }
    });
});



$('#add-friends-form').on('submit', function (e) {
    e.preventDefault();
    const displayId = $('#friendsId').val();

    $.ajax({
        url: 'https://localhost:7080/chatroom/Friends/addFriend',
        type: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ DisplayId: displayId }),
        success: function (response) {
            if (response.code == 200) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "已發送好友邀請",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                $('.modal').modal('hide');

            } else if (response.code == 404) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "未搜尋到ID",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;

            } else if (response.code == 409) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: "已經是好友",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            } else if (response.code == 460) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: "不能添加自己好友",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            } else if (response.code == 202) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: "已發送過邀請",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            }
        }
    })
});

function getfriendsRequests() {
    $.ajax({
        url: 'https://localhost:7080/chatroom/Friends/getFriendsRequests',
        type: 'GET',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.code == 200) {
                let count = response.data.length;
                updateFriendRequestCount(count);
                const $list = $('#friend-request-list');

                if (count > 0) {
                    $list.empty();

                    response.data.forEach(friend => {
                        const displayName = friend.requesterDisplayName || '未知使用者';
                        const requesterId = friend.requesterId;
                        const picture = `https://localhost:7080/${friend.requesterPicture}`

                        const itemHtml = `
                            <div class="d-flex align-items-center mb-3 justify-content-between">
                                <div class="d-flex align-items-center">
                                    <img src="${picture}" alt="使用者圖片" class="rounded-circle mr-3" width="50" height="50">
                                    <span class="font-weight-bold">${displayName}</span>
                                </div>
                                <div>
                                    <button class="btn btn-success btn-sm mr-1 accept-request" data-id="${requesterId}">接受</button>
                                    <button class="btn btn-danger btn-sm reject-request" data-id="${requesterId}">拒絕</button>
                                </div>
                            </div>
                        `;

                        $list.append(itemHtml);
                    });

                } else {
                    $list
                        .empty()
                        .append(`<p class="text-muted text-center">目前沒有好友邀請。</p>`);
                }

            }
        }
    })
}

function getFriendsList(){
    $.ajax({
        url: 'https://localhost:7080/chatroom/Friends/getFriendsList',
        type: 'GET',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.code == 200) {
                let friends = response.data.friendList;
                let groups = response.data.groupList;
                let list = $('.friends-list');
                let groupList = $('.groups-list');

                friends.forEach(friend => {
                    const displayName = friend.requesterDisplayName || '未知使用者';
                    const requesterId = friend.requesterId;
                    const picture = `https://localhost:7080/${friend.requesterPicture}`;

                    const itemHtml = `
                        <div class="d-flex align-items-center justify-content-between friend-card">
                            <div class="d-flex align-items-center">
                                <img src="${picture}" alt="使用者圖片" class="rounded-circle mr-3" width="50" height="50">
                                <span class="font-weight-bold">${displayName}</span>
                            </div>
                            <div>
                                <i class="fa fa-commenting chat-icon" title="開始聊天" onclick="startChat(${requesterId})"></i>
                                <i class="fa fa-trash delete-icon" title="刪除好友" onclick="deleteFriend(${requesterId})"></i>
                            </div>
                        </div>
                    `

                    list.append(itemHtml);
                })

                groups.forEach(group => {
                    const displayName = group.name || '未知使用者';
                    const chatRoomId = group.chatRoomId;
                    const picture = `https://localhost:7080/${group.picture}`;

                    const itemHtml = `
                        <div class="d-flex align-items-center justify-content-between friend-card">
                            <div class="d-flex align-items-center">
                                <img src="${picture}" alt="使用者圖片" class="rounded-circle mr-3" width="50" height="50">
                                <span class="font-weight-bold">${displayName}</span>
                            </div>
                            <div>
                                <i class="fa fa-commenting chat-icon" title="開始聊天" onclick="groupChat(${chatRoomId})"></i>
                                <i class="fa fa-trash delete-icon" title="退出聊天室" onclick="deleteGroup(${chatRoomId})"></i>
                            </div>
                        </div>
                    `

                    groupList.append(itemHtml);
                })


            }
        }
    })
}

function startChat(requesterId) {
    $.ajax({
        url: 'https://localhost:7080/chatroom/chat/startChat',
        type: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({Id:requesterId}),
        success: function (response) {
            const chatRoomId = response.data.chatRoomId
            localStorage.setItem("targetChatRoomId", chatRoomId);

            window.location.href = 'chatroom.html';
        }
    })
}

function groupChat(chatRoomId) {
    localStorage.setItem("targetChatRoomId", chatRoomId);
    window.location.href = 'chatroom.html';
}

function deleteGroup(chatRoomId){
Swal.fire({
        title: '確定要退出聊天室嗎？',
        text: "退出後聊天紀錄將無法恢復",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if(result.isConfirmed){
            $.ajax({
                url: 'https://localhost:7080/chatroom/Chat/exitGroup',
                type: 'POST',
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify({ chatRoomId: chatRoomId }),
                success: function (response) {
                    if (response.code == 200) {
                        window.location.reload();
                    }else{
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'warning',
                            title: "系統維修中，請稍後再試!",
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    }
                },
            })
        }
    })
}

function deleteFriend(requesterId) {
    Swal.fire({
        title: '確定要刪除嗎？',
        text: "刪除後聊天紀錄將無法恢復",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if(result.isConfirmed){
            $.ajax({
                url: 'https://localhost:7080/chatroom/Friends/deleteFriend',
                type: 'POST',
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify({friendId:requesterId}),
                success: function (response) {
                    if (response.code == 200) {
                        window.location.reload();
                    }
                }
            })
        }
    })
}