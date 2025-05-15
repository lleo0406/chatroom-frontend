let token=null;
$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    let requestToken = urlParams.get('token');
    token = requestToken;

    VerifyForgotPasswordToken(token);

});

$('.no-space').on('keydown', function (e) {
    if (e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
    }
});



$('#resetPasswordForm').on('submit', function (e) {
    e.preventDefault();

    const newPassword = $('[name="newPassword"]').val();
    const confirmNewPassword = $('[name="confirmNewPassword"]').val();

    if(newPassword != confirmNewPassword){
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: "新密碼與確認密碼不一致",
            showConfirmButton: false,
            timer: 3000
        })
    }else{
        let data ={};
        data['token'] = token;
        data['newPassword'] = newPassword;

        $.ajax({
            url: `${apiBaseUrl}/chatroom/User/resetPassword`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                let code = response.code;
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
                        window.location.href = '/index.html'; 
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
                }else if(code == 408){
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: "密碼重置時間已過，三秒後將跳轉至登入頁面",
                        showConfirmButton: false,
                        timer: 3000
                    })
                    setTimeout(function () {
                        window.location.href = '/login.html'; 
                    }, 3000);
                }
            }
        })
    }
});


function VerifyForgotPasswordToken(token){
    if(token == null || token == undefined){
        window.location.href = '/permissionDenied.html';
        return;
    }

    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/verifyForgotPasswordToken`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ Token: token }),
        success: function (response) {
            let code = response.code;
            if (code == 404) {
                window.location.href = '/permissionDenied.html';
            }else if(code == 200){
                $('.form-structor').css('display', 'flex');
            }
        }
    })
}