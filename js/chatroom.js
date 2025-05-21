let connection = null;
let currentChatRoomId = null;

$(document).ready(function () {

    const $toggle = $('#menuToggle');
    const $menu = $('#dropdownMenu');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const userId = userInfo?.id;

    $toggle.on('click', function (e) {
        e.stopPropagation();
        $menu.toggle();
    });

    $(document).on('click', function () {
        $menu.hide();
    });

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiBaseUrl}/chathub`, {
        })
        .withAutomaticReconnect()
        .build();

    connection.start().then(() => {
        console.log("SignalR Connected");

        connection.invoke("JoinRoom", userId)
            .catch(err => console.error(`加入聊天室失敗：${userId}`, err.toString()));

        ChatList();

    }).catch(err => console.error(err.toString()));

    connection.on("ReceiveMessage", function (message) {
        if (parseInt(message.chatRoomId) === currentChatRoomId) {
            renderMessage(message);
        }

        updateChatPreview(message);
    });
    
    connection.on("createChat", function (message) {
        ChatList()
    });

})

$('#footer-chat').on('click', '.send', function () {
    sendMessage();
})

$('#dropdownMenu').on('click', '.dropdown-item', function () {
    const action = $(this).data('action');

    switch (action) {
        case 'friend':
        case 'members':
        case 'invite':
            systemMaintenance();
            break;
        case 'exit':
            exitGroup();
            break;
    }
});


$('#footer-chat').on('keypress', '.write-message', function (e) {
    if (e.which === 13) {
        sendMessage();
        e.preventDefault();
    }
});

$('#groupAvatar, .change-photo-text').on('click', function () {
    $('#group-picture').click();
});

$('.friend-list').on('click', '.friend-item', function (e) {
    if ($(e.target).hasClass('friend-checkbox')) {
        return;
    }
    const checkbox = $(this).find('.friend-checkbox');
    checkbox.prop('checked', !checkbox.prop('checked'));
});


$('.create-group button').on('click', function () {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/Friends/getFriendsList`,
        type: 'GET',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            const friends = response.data.friendList;
            const container = $('.friend-list');
            let picture = null;


            container.empty();
            container.append('<span class="font-weight-bold">選擇好友</span>');
            friends.forEach(friend => {
                if (friend.requesterPicture == null) {
                    picture = `./image/user-default.webp`
                } else {
                    picture = friend.requesterPicture
                }

                const friendHtml = `
                    <div class="friend-item d-flex align-items-center mb-2 p-2 border rounded" data-id="${friend.requesterId}" style="cursor: pointer;">
                        <img src="${picture}" class="rounded-circle mr-2" width="40" height="40" alt="${friend.requesterDisplayName}">
                        <span class="friend-name">${friend.requesterDisplayName}</span>
                        <input type="checkbox" class="friend-checkbox ml-auto" style="cursor: pointer;">
                    </div>
                `;
                container.append(friendHtml);
            });

        }
    });
});

$('#group-picture').on('change', function (event) {
    const file = event.target.files[0];

    if (!file.type.startsWith('image/')) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "請選擇jpeg/png/jpg/webp檔案",
            showConfirmButton: false,
            timer: 3000
        })
        return;
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#groupAvatar').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

$('#create-group-form').on('submit', function (e) {
    e.preventDefault();

    const groupName = $('#group-name').val().trim();
    const pictureFile = $('#group-picture')[0].files[0];
    const selectedFriends = [];

    $('.friend-checkbox:checked').each(function () {
        const item = $(this).closest('.friend-item');
        const friendId = item.data('id');

        selectedFriends.push(friendId);
    });

    const formData = new FormData();
    formData.append('groupName', groupName);
    formData.append('photo', pictureFile);
    formData.append('selectedFriends', JSON.stringify(selectedFriends));

    $.ajax({
        url: `${apiBaseUrl}/chatroom/Chat/createGroup`,
        type: 'POST',
        data: formData,
        xhrFields: {
            withCredentials: true
        },
        contentType: false,
        processData: false,
        success: function (response) {
            if (response.code == 200) {
                window.location.reload();
            }

        }
    });
});


function ChatList() {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/Chat/getChatList`,
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.code == 200 && Array.isArray(response.data)) {
                joinAllChatRooms(response.data);

                const discussionsSection = $('.discussions');
                const targetId = localStorage.getItem("targetChatRoomId");
                $('.message-active').remove();
                let picture = null;

                $.each(response.data, function (index, chat) {
                    if (chat.picture == null || chat.picture == "") {
                        picture = `./image/user-default.webp`
                    } else {
                        picture = chat.picture
                    }
                    const discussionDiv = `
                        <div class="discussion message-active" data-id="${chat.chatRoomId}">
                            <div class="photo" style="background-image: url('${picture}');">
                            </div>
                            <div class="desc-contact">
                                <p class="name">${chat.name ?? '未知名稱'}</p>
                                <p class="message">${chat.lastMessage ?? ''}</p>
                            </div>
                        </div>
                    `;
                    discussionsSection.append(discussionDiv);
                });

                $('.message-active').off('click').on('click', function () {
                    const chatRoomId = $(this).data('id');
                    getChatMessages(chatRoomId, $(this));
                });


                if (targetId) {
                    const targetDiv = $(`.discussion[data-id='${targetId}']`);
                    if (targetDiv.length > 0) {
                        targetDiv.trigger('click');
                    }
                    localStorage.removeItem("targetChatRoomId");
                }
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    });
}

async function getChatMessages(chatRoomId, clickedElement) {

    if (currentChatRoomId === chatRoomId) {
        return;
    }
    currentChatRoomId = chatRoomId;

    $.ajax({
        url: `${apiBaseUrl}/chatroom/Chat/getChatMessages`,
        type: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({ chatRoomId: chatRoomId }),
        success: function (response) {
            if (response.code == 200) {
                const chatName = response.data.chatInfo.name;
                const chatRoomId = response.data.chatInfo.id;
                const messages = response.data.messages;
                const isPrivate = response.data.chatInfo.private;
                const chatHeader = $('.header-chat');
                const messagesContainer = $('#chatContainer');
                const chatFooter = $('#footer-chat');
                const dropdownMenu = $('#dropdownMenu');

                $('.header-chat').removeAttr("hidden");
                messagesContainer.empty();
                dropdownMenu.empty();
                chatFooter.empty();

                $.each(messages, function (index, message) {
                    dayjs.extend(window.dayjs_plugin_utc);
                    dayjs.extend(window.dayjs_plugin_timezone);

                    const formatted = dayjs.utc(message.sendAt)
                        .tz("Asia/Taipei")
                        .format("YYYY/MM/DD HH:mm:ss");
                    let messageHtml = '';

                    let picture = null;
                    if (message.senderPicture == null) {
                        picture = `./image/user-default.webp`
                    } else {
                        picture = message.senderPicture
                    }

                    // 判斷是自己的留言還是別人的
                    if (message.senderId == message.userId) {
                        messageHtml += `
                            <div class="message right">
                                <div class="bubble-container">
                                    <div class="bubble">${message.message}</div>
                                    <div class="timestamp">${formatted}</div>
                                </div>
                            </div>
                        `
                    } else {
                        messageHtml += `
                            <div class="message left">
                                <img src="${picture}" class="avatar" />
                                <div>
                                    <div class="name">${message.senderName}</div>
                                    <div class="bubble-container">
                                        <div class="bubble">${message.message}</div>
                                        <div class="timestamp">${formatted}</div>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                    messagesContainer.append(messageHtml);
                });

                $('#chat-name').text(chatName);
                chatHeader.attr("data-chat-room-id", chatRoomId);

                if (isPrivate) {
                    dropdownMenu.append(`
                        <div class="dropdown-item" data-action="friend" data-toggle="modal" data-target="#add-friends-modal">
                            <i class="fa fa-ban" aria-hidden="true"></i> 封鎖
                        </div>
                    `);
                } else {
                    dropdownMenu.append(`
                        <div class="dropdown-item" data-action="members">
                            <i class="fa fa-users" aria-hidden="true"></i> 成員
                        </div>
                        <div class="dropdown-item" data-action="invite">
                            <i class="fa fa-user-plus" aria-hidden="true"></i> 邀請
                        </div>
                        <div class="dropdown-item" data-action="exit">
                            <i class="fa fa-sign-out" aria-hidden="true"></i> 退出
                        </div>
                    `);
                }

                chatFooter.append(`
                    <div class="footer-chat">
                        <i class="icon fa fa-paperclip clickable" style="font-size:25pt;" aria-hidden="true"></i>
                        <input type="text" class="write-message" placeholder="Type your message here"></input>
                        <i class="icon send fa fa-paper-plane-o clickable" aria-hidden="true"></i>
                    </div>
                `);

                $('.discussion').removeClass('active');
                clickedElement.addClass('active');

                $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
            }
        }
    })
}

// SignalR 傳送訊息
async function sendMessage() {
    const message = $('.write-message').val().trim();
    if (message !== "" && currentChatRoomId !== null) {

        try {
            await connection.invoke("SendMessage", {
                chatRoomId: currentChatRoomId,
                message: message
            });
            $('.write-message').val('');
        } catch (err) {
            console.error("SignalR 發送訊息錯誤：", err);
        }
    }
}


function renderMessage(message) {
    const messagesContainer = $('#chatContainer');

    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);

    const formatted = dayjs.utc(message.sendAt)
        .tz("Asia/Taipei")
        .format("YYYY/MM/DD HH:mm:ss");
    const messageTime = new Date(formatted);
    const messageMinuteKey = `${messageTime.getFullYear()}-${messageTime.getMonth()}-${messageTime.getDate()} ${messageTime.getHours()}:${messageTime.getMinutes()}`;
    let picture = null;
    if (message.senderPicture == null) {
        picture = `./image/user-default.webp`
    } else {
        picture = message.senderPicture
    }
    let messageHtml = '';

    // 判斷是自己的留言還是別人的
    if (message.senderId == userProfile.id) {
        messageHtml += `
            <div class="message right">
                <div class="bubble-container">
                    <div class="bubble">${message.message}</div>
                    <div class="timestamp">${messageMinuteKey}</div>
                </div>
            </div>
        `
    } else {
        messageHtml += `
            <div class="message left">
                <img src="${picture}" class="avatar" />
                <div>
                    <div class="name">${message.senderName}</div>
                    <div class="bubble-container">
                        <div class="bubble">${message.message}</div>
                        <div class="timestamp">${messageMinuteKey}</div>
                    </div>
                </div>
            </div>
        `
    }

    messagesContainer.append(messageHtml);
    $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
}

function isNewChat(message) {
    const allChatRoomIds = $('.discussion').map(function () {
        return $(this).data('id');
    }).get();

    let exist = allChatRoomIds.includes(message.chatRoomId);
    let picture = null;
    if (message.senderPicture == null) {
        picture = `./image/user-default.webp`
    } else {
        picture = message.senderPicture
    }

    if (!exist) {
        const discussionsSection = $('.discussions');
        const discussionDiv = `
                <div class="discussion message-active" data-id="${message.chatRoomId}">
                    <div class="photo" style="background-image: url('${picture}');">
                    </div>
                    <div class="desc-contact">
                        <p class="name">${message.senderName ?? '未知名稱'}</p>
                        <p class="message">${message.message ?? ''}</p>
                    </div>
                </div>
            `;
        discussionsSection.append(discussionDiv);

        updateChatPreview(message);
    }
}

function updateChatPreview(message) {
    const chatRoomId = message.chatRoomId;
    const discussionSelector = `.discussion[data-id="${chatRoomId}"]`;
    const $discussion = $(discussionSelector);


    if ($discussion.length > 0) {
        $discussion.find(".message").text(message.message);

        const $discussionsContainer = $(".discussions");
        const $createGroup = $discussionsContainer.find(".create-group");

        if (!$discussion.is($createGroup.next())) {
            $discussion.insertAfter($createGroup);
        }
    }
}

function joinAllChatRooms(chatRooms) {
    chatRooms.forEach(chat => {
        connection.invoke("JoinRoom", chat.chatRoomId)
            .catch(err => console.error(`加入聊天室失敗：${chat.chatRoomId}`, err.toString()));
    });
}



function systemMaintenance() {
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

function exitGroup() {
    Swal.fire({
        title: '確定要退出嗎？',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${apiBaseUrl}/chatroom/Chat/exitGroup`,
                type: 'POST',
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify({ chatRoomId: currentChatRoomId }),
                success: function (response) {
                    if (response.code == 200) {
                        window.location.reload();
                    } else {
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