(function () {
    if (!localStorage.getItem('plena_auth_token_ml')) {
        window.location.href = 'index.html';
    }
})();
