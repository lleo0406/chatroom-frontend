const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("signup");
const apiBaseUrl = 'https://chatroom-backend-jjoi.onrender.com';

$('.no-space').on('keydown', function (e) {
    if (e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
    }
});

loginBtn.addEventListener("click", (e) => {
    let parent = e.target.parentNode.parentNode;
    Array.from(e.target.parentNode.parentNode.classList).find((element) => {
        if (element !== "slide-up") {
            parent.classList.add("slide-up");
        } else {
            signupBtn.parentNode.classList.add("slide-up");
            parent.classList.remove("slide-up");
        }
    });
});

signupBtn.addEventListener("click", (e) => {
    let parent = e.target.parentNode;
    Array.from(e.target.parentNode.classList).find((element) => {
        if (element !== "slide-up") {
            parent.classList.add("slide-up");
        } else {
            loginBtn.parentNode.parentNode.classList.add("slide-up");
            parent.classList.remove("slide-up");
        }
    });
});


$('.social-login').on('click', function () {
    window.location.href = `${apiBaseUrl}/chatroom/auth/google-login-url`;
});

$("#signup-form").on("submit", function (event) {
    event.preventDefault();

    const dataArray = $('#signup-form').serializeArray();
    const data = {};
    dataArray.forEach(item => {
        data[item.name] = item.value;
    });

    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/registerAccount`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (response) {
            if (response.code == 200) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "註冊成功",
                    showConfirmButton: false,
                    timer: 3000
                })
            } else if (response.code == 409) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "Email已被註冊",
                    showConfirmButton: false,
                    timer: 3000
                })
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    })

})

$("#login-form").on("submit", function (event) {
    event.preventDefault();

    const formData = {
        email: $('input[name="login-email"]').val(),
        password: $('input[name="login-password"]').val()
    };

    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/login`,
        type: "POST",
        contentType: "application/json",
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(formData),
        success: function (response) {
            if (response.code == 404) {
                $("#error-message").text("帳號密碼錯誤，請重新輸入").show();
            } else if (response.code == 200) {
                localStorage.setItem("userInfo", JSON.stringify(response.data.userInfo));

                $("#error-message").hide();
                window.location.href = "profile.html";
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    })

})


$('#forgotModal').on('hidden.bs.modal', function () {
    $('#forgot-email').val('');
});

$('#forgot-password-form').on('submit', function (event) {
    event.preventDefault();
    const email = $('#forgot-email').val().trim();

    $.ajax({
        url: `${apiBaseUrl}/chatroom/User/forgotPassword`,
        type: 'Post',
        contentType: 'application/json',
        data: JSON.stringify({ Email: email }),
        success: function (response) {
            if (response.code == 404) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: "Email錯誤",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else if (response.code == 200) {
                const submitButton = $('#forgot-password-btn'); // 按鈕 ID
                let countdown = 30;

                submitButton.prop('disabled', true);
                const originalText = submitButton.text();
                submitButton.text(`請等待 (${countdown} 秒)`);

                const interval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                        submitButton.text(`請等待 (${countdown} 秒)再次發送`);
                    } else {
                        clearInterval(interval);
                        submitButton.prop('disabled', false);
                        submitButton.text(originalText);
                    }
                }, 1000);

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "發送成功，請等待收取Email",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

            }
        },
        error: function (xhr, status, error) {
            console.log(error);
        }
    })

})