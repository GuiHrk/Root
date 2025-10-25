(function (){
    const body = document.body;

    const defaultTheme = {
        cta: "#5C2D91",
        signup: "#5C2D91",
        loginBorder: "#8A4FDC" 
    };

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light"){
        body.style.setProperty("--bg-color", "#F5F5F5");
        body.style.setProperty("--text-color", "#1A112F");
    }else{
        body.style.setProperty("--bg-color", "#1A112F");
        body.style.setProperty("--text-color", "#F5F5F5");
    }


    const savedColor = localStorage.getItem("color");
    if(savedColor){
        body.style.setProperty("--btn-cta-start", savedColor);
        body.style.setProperty("--btn-signup-start", savedColor);
        body.style.setProperty("--btn-login-border", savedColor);
    }else{
       body.style.setProperty("--btn-cta-start", defaultTheme.cta);
       body.style.setProperty("--btn-signup-start", defaultTheme.signup);
       body.style.setProperty("--btn-login-border", defaultTheme.loginBorder); 
    }
})();