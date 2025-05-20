$(document).ready(function () {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/getUserInfo`,
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        crossDomain: true,
        success: function (response) {
            if (response.code == 200) {
                $('#userName').text(response.data.displayName || '未設定暱稱');
                $('#userEmail').text(response.data.email || '未設定Email');
                $('#userDisplayId').text(response.data.displayId || '未設定ID');
                if (response.data.picture != null) {
                    $('#userAvatar').attr('src', response.data.picture);
                }
                localStorage.setItem('userInfo', JSON.stringify(response.data));
            }

        },
    })
});

$('.no-space').on('keydown', function (e) {
    if (e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
    }
});

$('#userAvatar, .change-photo-text').on('click', function () {

    $('#avatarInput').click();
});

$('#edit-name-modal').on('show.bs.modal', function () {
    $('#newUserName').val("");
});

$('#edit-id-modal').on('show.bs.modal', function () {
    $('#newDisplayId').val("");
});

$('#edit-email-modal').on('show.bs.modal', function () {
    $('#password').val('');
});

$('#edit-password-modal').on('show.bs.modal', function () {
    $('#OriginalPassword').val('');
    $('#newPassword').val('');
    $('#ConfirmNewPassword').val('');
});

$('#avatarInput').on('change', function () {
    const file = this.files[0];
    $(this).val('');
    if (!file) return;

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

    Swal.fire({
        title: '確定要上傳嗎？',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('avatar', file);

            $.ajax({
                url: `${apiBaseUrl}/chatroom/User/uploadAvatar`,
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                contentType: false,
                processData: false,
                data: formData,
                success: function (response) {
                    if (response.code == 200) {
                        $('#userAvatar').attr('src', `${apiBaseUrl}` + response.data);
                    }
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: "更新成功",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                },
                error: function (xhr, status, error) {
                    console.log(error);
                }
            })
        }
    })
});

$('.no-space').on('paste', function (e) {
    const pasted = (e.originalEvent || e).clipboardData.getData('text');
    if (/\s/.test(pasted)) {
        e.preventDefault();
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "請不要輸入空格",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
});

$('#edit-name-form').on('submit', function (e) {
    e.preventDefault(); // 防止預設表單提交
    const userInfo = localStorage.getItem('userInfo');
    const user = JSON.parse(userInfo);
    const newName = $('#newUserName').val();
    if (newName == user.displayName) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "暱稱不能與原本一樣",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    }
    if (!newName.trim()) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "暱稱不能為空!",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    }

    updateUserInfoField('displayName', newName, `${apiBaseUrl}/chatroom/User/updateName`);
});

$('#edit-id-form').on('submit', function (e) {
    e.preventDefault(); // 防止預設表單提交
    const userInfo = localStorage.getItem('userInfo');
    const user = JSON.parse(userInfo);
    const newDisplayId = $('#newDisplayId').val();
    if (!newDisplayId.trim()) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "ID不能為空!",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    } else if (newDisplayId == user.displayId) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "ID不能與原本一樣",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    }

    updateUserInfoField('displayId', newDisplayId, `${apiBaseUrl}/chatroom/User/updateDisplayId`);
});

$('#edit-email-form').on('submit', function (e) {
    e.preventDefault();
    const dataArray = $('#edit-email-form').serializeArray();
    const data = {};
    dataArray.forEach(item => {
        data[item.name] = item.value;
    });

    const newEmail = data.Email;

    if (!newEmail.trim()) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "Email不能為空!",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    }
    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/updateEmail`,
        method: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(data),
        success: function (response) {
            let code = response.code;
            if (code == 200) {
                var user = JSON.parse(localStorage.getItem('userInfo'));
                user.email = newEmail;
                localStorage.setItem('userInfo', JSON.stringify(user));
                $('#userEmail').text(newEmail);
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

            } else if (code == 409) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "Emai已經被使用過了",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
            } else if (code == 403) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "密碼錯誤",
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
});

$('#edit-password-form').on('submit', function (e) {
    e.preventDefault(); // 防止預設表單提交

    const dataArray = $('#edit-password-form').serializeArray();
    const data = {};

    dataArray.forEach(item => {
        data[item.name] = item.value;
    });
    if (data.NewPassword != data.confirmNewPassword) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "新密碼與確認密碼不一致",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return;
    }

    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/updatePassword`,
        type: 'POST',
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(data),
        success: function (response) {
            if (response.code == 404) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "原本密碼輸入錯誤",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else if (response.code == 200) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "密碼更換成功",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                $('.modal').modal('hide');
            } else if (response.code == 409) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "不能與原始密碼一樣",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            }
        },
        error: function (xhr, status, error) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: xhr.responseText,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        }


    })
});
