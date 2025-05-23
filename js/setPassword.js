$(document).ready(function () {
    alreadySetPs();

});

$('.no-space').on('keydown', function (e) {
    if (e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
    }
});

$('#resetPasswordForm').on('submit', function (e) {
    e.preventDefault();

    const Password = $('[name="newPassword"]').val();
    const confirmNewPassword = $('[name="confirmNewPassword"]').val();

    if(Password != confirmNewPassword){
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "密碼與確認密碼不一致",
            showConfirmButton: false,
            timer: 3000
        })
    }else{

        $.ajax({
            url: `${apiBaseUrl}/chatroom/User/setPassword`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({Password : Password}),
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                let code = response.code;
                console.log(code);
                if (code == 200) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: "密碼重置成功，三秒後將跳轉至登入頁面",
                        showConfirmButton: false,
                        timer: 3000
                    })
                    setTimeout(function () {
                        window.location.href = '/profile.html'; 
                    }, 3000);
                }else if(code == 400){
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: "操作失敗",
                        showConfirmButton: false,
                        timer: 3000
                    })
                }
            }
        })
    }
});

function alreadySetPs() {
    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/alreadySetPs`,
        method: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.code == 200) {
                window.location.href = '/index.html';
            }
            $('.form-structor').css('display', 'flex');
        },
        error: function () {
            window.location.href = '/index.html';
        }
    });
}