
module.exports = {
    CACHE_PREFIX: "CHECKIN",
    MAIL: {
        host: "mail.becawifi.vn",
        port: 465,
        secure: true,
        // logger:true,
        // debug:true,
        auth: {
            user: "noreply@becawifi.vn",
            pass: "460x4UmL"
        },
        tls: {
            rejectUnauthorized: false,
        }
    },
    AP: { _id: "1", name: "Default", location: { _id: 1, name: "Default" }, username: "jwifi2m", password: "jwifi2m", campaignoff: [], mac_ap: "DD-EE-FF-DD-EE-FF", ip: "http://127.0.0.1", group: { _id: "2" }, "bwdown": 10000000, "bwup": 10000000, "idle": 120, "session": 120 },
    CAMPAIGN: {
        _id: 1,
        kindof: "free",
        name: "[Default]",
        status: "Active",
        weight: 1,
        banner: {
            id: "1",
            status: "Active",
            target: [],
            name: "Default",
            media: {},
            weight: 1,
            landingpage: "http://becamex.com.vn/",
            campaign: { _id: 1, kindof: "free", name: "[Default]" },
            group: "1",
            inherited: [],
            layout: false,
            createdBy: "admin",
            keyword: "default",
            updatedBy: "admin",
            html: "<div style=\"text-align: center; margin: 0 auto; width: 100%;\"><img onclick=\"jwifi_login_hotspot\(\);\" src=\"/public/default.jpg\" style=\"max-width: 100%; text-align: center;\" alt=\"\"></div>",
            createdAt: "2018-06-06 11:23:07",
            updatedAt: "2018-06-06 11:23:07"
        }
    },
    BANNER_DEFAULT: {
        weight: 1,
        html: `<link rel="stylesheet" href="https://checkin.becawifi.vn/public/static/assets/css/font-awesome.min.css"
        crossorigin="anonymous | use-credentials">
        <style>
        :root {
        --primary-color: rgba(0, 81, 152, 1);
        }

        * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        }

        button {
        outline: none;
        }

        img {
        width: 100%;
        }

        p {
        margin: 0;
        }

        html,
        body {
        height: 100%;
        }

        body {
        padding: 0;
        max-width: 100%;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        }

        .noselect {
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        }

        #jwifi_main {
        margin: 0 auto;
        max-width: 100%;
        overflow: hidden;
        height: 100%;
        }

        #jwifi_main>.wrapper {
        padding: 0 15px;
        position: relative;
        height: 100%;
        }

        #jwifi_main .wrapper .top {
        position: relative;
        padding: 30px 10px;
        text-align: center;
        z-index: 200;
        }

        #jwifi_main .wrapper .top .meta .logo {
        position: absolute;
        top: 10px;
        left: 0;
        width: 130px;
        height: 60px;
        }

        #jwifi_main .wrapper .top .meta .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: left;
        }



        #jwifi_main .wrapper .top .meta .tool {
        position: absolute;
        top: 20px;
        right: 0;
        display: flex;
        }

        #jwifi_main .wrapper .top .meta .tool>div {
        margin-left: 20px;
        position: relative;
        }

        #jwifi_main .wrapper .top .meta .tool>div i {
        font-size: 18px;
        color: #fff;
        cursor: pointer;
        }

        #jwifi_main .wrapper .top .meta .tool>div .badge {
        position: absolute;
        top: 0;
        right: 0;
        border-radius: 50%;
        background: red;
        color: #fff;
        padding: 0;
        width: 8px;
        height: 8px;
        font-size: 11px;
        margin: 0px;
        display: none;
        }

        #jwifi_main .wrapper .top .meta .tool>div.active .badge {
        display: block;
        }

        #jwifi_main .wrapper>.content {
        position: relative;
        margin-top: 0;
        padding: 20px 15px;
        height: calc(100% - 90px);
        overflow: visible;
        }

        #jwifi_main .wrapper .content .container {
        width: 100%;
        height: 100%;
        background: #fafafa;
        padding: 0;
        position: relative;
        margin: 0;
        border-radius: 1px;
        border: 1px solid #eee;
        display: flex;
        align-items: center;
        border-radius: 5px;
        }

        #jwifi_main .wrapper .content .container .extra {
        padding: 10px;
        padding-bottom: 0px;
        margin-top: 100px;
        margin-bottom: 50px;
        width: 100%;
        height: calc(100% - 145px);
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        }

        #jwifi_main div::-webkit-scrollbar {
        width: 3px;
        }

        #jwifi_main div::-webkit-scrollbar-track {
        background: transparent;
        }

        #jwifi_main div::-webkit-scrollbar-thumb {
        background: transparent;
        }

        #jwifi_main div:hover::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        }

        #jwifi_main .wrapper>.content:before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 85%;
        background: #fafafa;
        opacity: 0.5;
        transform: translate(-50%, -50%);
        border-radius: 5px;
        }

        #jwifi_main .wrapper .content .info {
        position: absolute;
        top: -61px;
        z-index: 1000;
        text-align: center;
        width: 100%;
        color: #555;
        }

        #jwifi_main .wrapper .content .info .avatar {
        position: relative;
        width: 120px;
        height: 120px;
        background-repeat: no-repeat;
        background-size: contain;
        padding: 20px;
        margin: 0 auto;
        }

        #jwifi_main .wrapper .content .info .avatar img {
        position: relative;
        top: 50%;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: translateY(-50%);
        border-radius: 50%;
        border: 3px solid #fafafa;
        z-index: -1;
        background: #fafafa;
        overflow: hidden;
        }

        #jwifi_main .wrapper .content .info .greeting {
        margin: 0 0 5px 0;
        color: #555;
        font-size: 15px;
        }

        #jwifi_main .wrapper .content .info .date {
        margin: 0 0 5px 0;
        color: #555;
        font-size: 13px;
        background: #fafafa;
        }

        #jwifi_main .wrapper .content .menu {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 50%);
        width: 100%;
        display: flex;
        justify-content: space-between;
        z-index: 1000;
        }

        #jwifi_main .wrapper .content .menu>div {
        width: 35px;
        height: 35px;
        background: var(--primary-color);
        border-radius: 50%;
        text-align: center;
        line-height: 35px;
        color: #fafafa;
        margin: 0 20px;
        }

        #jwifi_main .wrapper .content .menu>div>i {
        line-height: 35px;
        }

        #jwifi_main .wrapper .content .menu .touch-zone {
        width: 80px;
        height: 80px;
        position: absolute;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        margin: 0;
        cursor: pointer;
        background: var(--primary-color);
        }

        #jwifi_main .wrapper .content .menu .touch-zone .cover {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 80px;
        height: 0;
        overflow: hidden;
        /* border-radius: 50%; */
        }

        #jwifi_main .wrapper .content .menu .touch-zone .touch-image {
        width: 80px;
        height: 80px;
        margin: 0;
        background-image: url("/public/static/checkin/touch_id.png");
        background-size: 65px;
        background-repeat: no-repeat;
        background-position: center;
        opacity: .5;
        filter: brightness(5);
        }

        #jwifi_main .wrapper .content .menu .touch-zone .touch-image-hold {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 80px;
        height: 80px;
        margin: 0;
        background-image: url("/public/static/checkin/touch_id_hold.png");
        background-size: 65px;
        background-repeat: no-repeat;
        background-position: center;
        filter: saturate(0);
        }

        #jwifi_main .wrapper .content .quote {
        padding: 30px 20px 25px 20px;
        /* background: #fff; */
        border-radius: 5px;
        border: 1px solid #ccc;
        position: relative;
        text-align: right;
        /* overflow: hidden; */
        }

        #jwifi_main .wrapper .content .quote span {
        position: absolute;
        font-size: 25px;
        color: var(--primary-color);
        z-index: 49;
        /* filter: drop-shadow(0px 1px 15px #777); */
        background: #fafafa;
        padding: 8px;
        line-height: 0px;
        width: 40px;
        height: 40px;
        border-radius: 5px;
        }

        #jwifi_main .wrapper .content .quote span.quote-left {
        top: -8px;
        left: -8px;
        }

        #jwifi_main .wrapper .content .quote span.quote-right {
        bottom: -8px;
        right: -8px;
        }

        #jwifi_main .wrapper .content .quote p {
        position: relative;
        z-index: 50;
        font-size: 14px;
        font-family: serif;
        font-style: italic;
        color: #555;
        font-weight: bold;
        line-height: 18px
        }

        #jwifi_main .wrapper .content .quote p.text {
        text-align: left;
        }

        #jwifi_main .wrapper .content .quote p.author {
        margin-top: 5px;
        padding: 0 5px;
        font-weight: 400;
        position: relative;
        background: #fafafa;
        display: inline-block;
        z-index: 50;
        }

        #jwifi_main .wrapper .content .quote p.author:before {
        position: absolute;
        content: '';
        width: 8px;
        height: 1px;
        background: #555;
        top: 50%;
        right: 100%;
        transform: translateY(-50%);
        }

        #jwifi_main .wrapper .content .quote p.author:after {
        position: absolute;
        content: '';
        width: 8px;
        height: 1px;
        background: #555;
        top: 50%;
        left: 100%;
        transform: translateY(-50%);
        }

        #jwifi_main .wrapper .content .reason {
        margin-top: 10px;
        margin-right: 10px;
        padding: 15px 10px 10px 10px;
        border: 1px solid var(--primary-color);
        border-radius: 5px;
        position: relative;
        }

        #jwifi_main .wrapper .content .reason .reason-wrapper {
        max-height: calc(100vh - 410px);
        overflow-x: hidden;
        }

        #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar {
        width: 3px;
        }

        #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar-track {
        background: transparent;
        }

        #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar-thumb {
        background: transparent;
        }

        #jwifi_main .wrapper .content .reason .reason-wrapper:hover::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        }

        #jwifi_main .wrapper .content .reason::before {
        position: absolute;
        top: 0;
        right: 0;
        padding: 8px;
        content: "\f29c";
        font: normal normal normal 40px/1 FontAwesome;
        background: #fafafa;
        transform: translate(50%, -50%);
        color: var(--primary-color);
        line-height: 35px;
        }

        #jwifi_main .wrapper .content .reason .reason-heading {
        position: absolute;
        top: 0;
        left: 10px;
        font-size: 15px;
        color: #f9af66;
        background: #fafafa;
        padding: 10px;
        transform: translateY(-50%)
        }

        #jwifi_main .wrapper .content #checkin__wrapper {
        height: 100%;
        width: 100%;
        position: absolute;
        display: block;
        background-color: #fafafa;
        }

        #jwifi_main .wrapper .content #login__wrapper {
        font-size: 14px;
        line-height: 1.5;
        color: #555;
        width: 100%;
        height: 100%;
        text-align: center;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;

        }

        #jwifi_main .wrapper .content #login__wrapper .frm {
        text-align: left;
        width: 90%;
        margin: 20px auto;
        border: 1px solid #ccc;
        padding: 20px;
        border-radius: 5px;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm .control {
        margin: 10px 0;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm .control .label {
        margin-bottom: 10px;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm .control input {
        width: 100%;
        padding: 8px 15px;
        border-radius: 50px;
        border: 1px solid #ccc;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm button {
        margin-top: 20px;
        width: 100%;
        padding: 8px 15px;
        font-weight: bold;
        border-radius: 50px;
        border: 1px solid #ccc;
        box-shadow: none;
        }

        .fake-control input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        }

        .checkmark {
        display: inline-block;
        line-height: 1;
        vertical-align: middle;
        }

        .fake-control:hover input~.checkmark {
        opacity: .5;
        }

        .fake-control input:checked~.checkmark {
        opacity: 1;
        }

        .fake-control .checkmark:after {
        font-family: FontAwesome, simple-line-icons;
        color: var(--main-color);
        vertical-align: top;
        }

        .fake-control.radio .checkmark:after {
        content: "\f1db";
        font-size: 18px;
        }

        .fake-control.radio input:checked~.checkmark:after {
        content: "\f192";
        color: var(--primary-color);
        }

        .group-control {
        margin: 20px 10px;
        display: flex;
        align-items: center;
        color: #555;
        }

        .group-control .fake-control {
        margin-right: 20px;
        }

        .group-control span {
        font-size: 14px;
        }

        #jwifi_main .wrapper .content .birthday {
        flex-direction: column;
        flex: 1;
        margin-top: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        overflow: hidden;
        background: #fff;
        }

        #jwifi_main .wrapper .content .birthday .heading {
        margin: 0;
        padding: 10px 17px;
        text-transform: uppercase;
        font-size: 14px;
        color: #5c788e;
        position: relative;
        display: flex;
        align-items: center;
        background: linear-gradient(90deg, #e9e6e1 60px, #f2f1ed 0);
        }

        #jwifi_main .wrapper .content .birthday .heading h4 {
        display: table-cell;
        vertical-align: middle;
        width: 100%;
        }

        #jwifi_main .wrapper .content .birthday .heading i {
        display: table-cell;
        vertical-align: middle;
        }

        #jwifi_main .wrapper .content .birthday .wrapper {
        overflow-x: hidden;
        background: linear-gradient(90deg, #e9e6e1 60px, #f2f1ed 0);
        height: 100%;
        padding-bottom: 40px;
        }

        #jwifi_main .wrapper .content .birthday .user {
        text-align: left;
        display: flex;
        align-items: center;
        }

        #jwifi_main .wrapper .content .birthday .user .left {
        position: relative;
        /* background: #e9e6e0; */
        padding: 2px 5px;
        }

        #jwifi_main .wrapper .content .birthday .user:first-child .left {
        padding-top: 5px;
        }

        #jwifi_main .wrapper .content .birthday .user:last-child .left {
        padding-bottom: 5px;
        }

        #jwifi_main .wrapper .content .birthday .user .left .avatar {
        width: 70px;
        height: 70px;
        background: #eee;
        border: 2px solid #fff;
        margin: 5px;
        border-radius: 50%;
        position: relative;
        z-index: 100;
        overflow: hidden;
        }

        #jwifi_main .wrapper .content .birthday .user .left .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .name {
        margin: 0;
        font-size: 14px;
        position: relative;
        z-index: 50;
        font-weight: bold;
        color: #ffffff;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .name span {
        margin: 0;
        padding: 5px 25px;
        padding-left: 30px;
        padding-top: 5px;
        display: block;
        font-weight: bold;
        text-transform: capitalize;
        color: #fff;
        font-size: 14px;
        background: var(--primary-color);
        width: calc(100% - 15px);
        opacity: .8;
        }

        #jwifi_main .wrapper .content .birthday .user .meta {
        margin-left: -25px;
        padding-left: 0;
        padding-right: 5px;
        width: 100%;
        margin-top: 10px;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .date {
        color: #8295a3;
        font-size: 12px;
        font-weight: bold;
        padding-left: 30px;
        margin: 5px 0;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .date i {
        margin-right: 5px;
        color: var(--primary-color);
        font-size: 13px;
        }

        #jwifi_main .wrapper .content .birthday .user .left .gender {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 2px solid #fff;
        text-align: center;
        z-index: 101;
        }

        #jwifi_main .wrapper .content .birthday .user .left .gender i {
        font-size: 12px;
        line-height: 22px;
        color: #fff;
        }

        #jwifi_main .wrapper .content .birthday .user .left .gender.mars {
        background: #2196F3
        }

        #jwifi_main .wrapper .content .birthday .user .left .gender.venus {
        background: #F06292
        }

        #jwifi_main .wrapper .content .birthday .user .meta .count {
        position: absolute;
        top: 50%;
        right: 0;
        width: 35px;
        height: 35px;
        background: #777;
        border-radius: 50%;
        border: 3px solid #fff;
        text-align: center;
        line-height: 30px;
        transform: translateY(-50%);
        }

        #jwifi_main .wrapper .content .birthday .user .meta .count i {
        line-height: 30px;
        }

        #jwifi_main .wrapper .content .birthday .user:not(:last-child) .meta .count:before {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        width: 5px;
        height: 70px;
        background: #fff;
        transform: translateX(-50%);
        z-index: -1;
        border-radius: 15px;
        }

        #jwifi_main .wrapper .content .birthday .user:first-child .meta .count:after {
        height: 20px;
        content: "";
        position: absolute;
        bottom: 100%;
        left: 50%;
        width: 5px;
        background: #fff;
        transform: translateX(-50%);
        z-index: -1;
        border-radius: 15px;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .count.coming {
        background: #4CAF50;
        }

        #jwifi_main .wrapper .content .birthday .user .meta .count.today {
        background: #F44336;
        }

        #jwifi_main .version {
        position: absolute;
        bottom: 0;
        left: 0;
        color: #fafafa;
        font-size: 12px;
        margin: 2px 5px;
        }

        .modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        visibility: hidden;
        z-index: 999999;
        }

        .modal.open {
        visibility: visible;
        }

        .modal.open .modal-dialog {
        z-index: 9999;
        transform: translate(-50%, -50%) scale(1);
        }

        .modal .modal-dialog {
        position: absolute;
        top: 50%;
        left: 50%;
        padding: 20px;
        background: #fff;
        width: 90%;
        min-height: 200px;
        border-radius: 10px;
        box-shadow: 0px 4px 18px #00000036;
        z-index: -1;
        transform: translate(-50%, -50%) scale(0);
        transition: .5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        border: 1px solid #eee;
        }

        .modal .modal-dialog .modal-body {
        text-align: center;
        }

        .modal .modal-dialog .modal-body img {
        width: 35%;
        margin: 0 auto;
        }

        .modal .modal-dialog .modal-body h4 {
        margin: 10px;
        font-size: 16px;
        color: #f9b859;
        }

        .modal .modal-dialog .modal-body p {
        margin-bottom: 1rem;
        font-size: 13px;
        color: #999;
        }

        .modal .modal-dialog .modal-body button.btn-dismiss {
        background: #f9b859;
        padding: 8px 10px;
        border-radius: 15px;
        color: #fff;
        border: none;
        font-weight: bold;
        cursor: pointer;
        }

        #reasonArriveLateForm ul.listReasonLate {
        list-style: none;
        text-align: left;
        color: #3071a9;
        font-size: 14px;
        font-weight: bold;
        width: 100%;
        max-width: 320px;
        margin: auto;
        }

        #reasonArriveLateForm ul.listReasonLate li {
        margin: 10px 0;
        }

        #reasonArriveLateForm ul.listReasonLate li .radio-group {
        display: flex;
        align-items: center;
        }

        #reasonArriveLateForm ul.listReasonLate li .radio-group input {
        width: 15px;
        height: 15px;
        margin-right: 10px;
        }

        #reasonArriveLateForm ul.listReasonLate textarea {
        width: 100%;
        padding: 10px 20px;
        margin-bottom: 10px;
        background: #eee;
        border: none;
        border-radius: 10px;
        resize: none;
        outline-color: #999;
        }

        #reasonArriveLateForm ul.listReasonLate textarea:disabled::placeholder {
        color: #ccc;
        }

        #reasonArriveLateForm ul.listReasonLate textarea:disabled:-ms-input-placeholder {
        color: #ccc;
        }

        #reasonArriveLateForm ul.listReasonLate textarea:disabled::-ms-input-placeholder {
        color: #ccc;
        }
        </style>
        <div id="jwifi_main">
        <div class="wrapper" style="background:linear-gradient(0deg,rgba(158, 0, 0, 1) 0.17095060430021367%,rgba(0, 81, 152, 1) 100%)">
        <div class="top">
        <div class="meta">
            <div class="logo">
                <img src="/public/campaign/1/logo.png" alt="">
            </div>
        </div>
        </div>
        <div class="content">
        <div class="container">
            <div id="checkin__wrapper">
                <div class="info">
                    <div id="frame" class="avatar">
                        <img id="avatar" src="/public/static/checkin/avatar.png" alt="">
                    </div>
                    <p class="greeting">
                        <b>Hi <span id="username">Someone</span></b>. <span id="greeting"> Have
                            a good day!</span>
                    </p>
                    <p class="date">
                        Today, <b id="currentTime"></b>
                    </p>
                </div>
                <div class="extra">
                    <div id="quote" class="quote">
                        <span class="quote-left"><i class="fa fa-quote-left" aria-hidden="true"></i></span>
                        <p id="quote-content" class="text noselect">It's Not a Bug, It's a Feature.</p>
                        <p id="quote-author" class="author">DEV Community</p>
                        <span class="quote-right"><i class="fa fa-quote-right" aria-hidden="true"></i></span>
                    </div>
                    <div class="birthday">
                        <div class="heading">
                            <h4>Upcoming Birthdays</h4>
                            <i class="fa fa-calendar" aria-hidden="true"></i>
                        </div>
                        <div id="birthdays" class="wrapper">
                            <div class="user">
                                <div class="left">
                                    <div class="avatar">
                                        <img src="/public/static/checkin/avatar.png" alt="">
                                    </div>
                                    <div class="gender mars">
                                        <i class="fa fa-mars"></i>
                                    </div>
                                </div>
                                <div class="meta">
                                    <div class="name">
                                        <span>Nickname</span>
                                        <div class="count today">
                                            <i class="fa fa-birthday-cake"></i>
                                        </div>
                                    </div>
                                    <div class="date">
                                        <i class="fa fa-gift" aria-hidden="true"></i>DD-MM-YYYY
                                    </div>
                                </div>
                            </div>
                            <div class="user">
                                <div class="left">
                                    <div class="avatar">
                                        <img src="/public/static/checkin/avatar.png" alt="">
                                    </div>
                                    <div class="gender venus">
                                        <i class="fa fa-venus"></i>
                                    </div>
                                </div>
                                <div class="meta">
                                    <div class="name">
                                        <span>Nickname</span>
                                        <div class="count coming">
                                            02
                                        </div>
                                    </div>
                                    <div class="date">
                                        <i class="fa fa-gift" aria-hidden="true"></i>DD-MM-YYYY
                                    </div>
                                </div>
                            </div>
                            <div class="user">
                                <div class="left">
                                    <div class="avatar">
                                        <img src="/public/static/checkin/avatar.png" alt="">
                                    </div>
                                    <div class="gender venus">
                                        <i class="fa fa-venus"></i>
                                    </div>
                                </div>
                                <div class="meta">
                                    <div class="name">
                                        <span>Nickname</span>
                                        <div class="count">
                                            <i class="fa fa-check"></i>
                                        </div>
                                    </div>
                                    <div class="date">
                                        <i class="fa fa-gift" aria-hidden="true"></i>DD-MM-YYYY
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p></p>
                <div class="menu">
                    <div id="touchID" class="touch-zone noselect">
                        <div id="fingerAnimation" class="cover noselect">
                            <div class="touch-image-hold noselect"></div>
                        </div>
                        <div class="touch-image noselect"></div>
                    </div>
                </div>
            </div>
            <div id="login__wrapper" style="display:none">
                <h2>Không tìm thấy thiết bị!</h2>
                <p>Vui lòng đăng nhập hệ thống để lưu thiết bị và chấm công.</p>
                <form id="frmLogin" class="frm">
                    <div class="control">
                        <h3 class="label">Tên đăng nhập:</h3>
                        <input id="txtUsername" type="text" autocorrect="off" autocapitalize="off" />
                    </div>
                    <div class="control">
                        <h3 class="label">Mật khẩu:</h3>
                        <input id="txtPassword" type="password" />
                    </div>
                    <button type="submit">ĐĂNG NHẬP</button>
                </form>
            </div>
        </div>
        </div>
        <div class="modal" id="notification">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-body">
                    <img id="notification-icon" src="/public/static/checkin/icon_notification.png"
                        alt="">
                    <h4 class="heading">You are have a notification!</h4>
                    <p class="message"></p>
                    <p id="hidePopup" hidden>
                        <input id="popup" type="checkbox" style="margin-right:5px">
                        <span>Don't show this message again</span>
                    </p>
                    <button id="btnCloseCheckinAlert" class="btn-dismiss">Đóng</button>
                </div>
            </div>
        </div>
        </div>
        <div class="modal" id="reasonArriveLateForm">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-body">
                    <img id="notification-icon"
                        src="https://ads.becawifi.vn/public/campaign/2/1655102154759-quicktime-04-ai.png" alt="">
                    <p class="message" style="margin: 5px 0;"></p>
                    <h4 class="heading"></h4>
                    <ul class="listReasonLate">
                        <li>
                            <label class="radio-group">
                                <input type="radio" name="reason" onchange="onChangeReason(this)" value="Kẹt xe"
                                    checked /> Kẹt xe
                            </label>
                        </li>
                        <li>
                            <label class="radio-group">
                                <input type="radio" name="reason" onchange="onChangeReason(this)" value="Xe hỏng" />
                                Xe hỏng
                            </label>
                        </li>
                        <li>
                            <label class="radio-group">
                                <input type="radio" name="reason" onchange="onChangeReason(this)" value="Dậy trễ" />
                                Dậy trễ
                            </label>
                        </li>
                        <li>
                            <label class="radio-group">
                                <input type="radio" name="reason" onchange="onChangeReason(this)" value="other" />
                                Khác
                            </label>
                        </li>
                        <li>
                            <textarea id="otherReason" rows="5" placeholder="Tối đa 150 ký tự." disabled></textarea>
                        </li>
                    </ul>
                    <div><button type="button" onclick="onSubmitReasonLate()" class="btn-dismiss">Gửi lên</button>
                    </div>
                </div>
            </div>
        </div>
        </div>
        <div class="version">
        Verion 1.3.1
        </div>
        </div>
        </div>
        <script>
        // function autoLowercaseText() {
        //     let username = document.getElementById("txtUsername").value
        //     if(username)
        //         document.getElementById("txtUsername").value = username.toLowerCase()
        // }
        document.getElementById("frmLogin").addEventListener("submit", function (event) {
        event.preventDefault();
        let username = document.getElementById("txtUsername").value.replace(' ', '').toLowerCase()
        let password = document.getElementById("txtPassword").value.toLowerCase()
        if (username == "") {
        openCheckinAlert({
            header: "Đã có lỗi xảy ra!",
            msg: "Vui lòng nhập tên đăng nhập.",
            textAlign: "center"
        })
        return
        }
        if (password == "") {
        openCheckinAlert({
            header: "Đã có lỗi xảy ra!",
            msg: "Vui lòng nhập mật khẩu.",
            textAlign: "center"
        })
        return
        }
        jwifi_checkin_bypass(username, password, function (res) {
        if (res.status) {
            var msg = "";
            if (res.check == "checkin") {
                if (res.lateIn > 0) {
                    openCheckinAlert({
                        id: "reasonArriveLateForm",
                        header: "Hãy cho tôi biết lý do bạn đi trễ hôm nay!",
                        msg: "Hôm nay bạn đến trễ " + res.lateIn + " phút."
                    })
                    return false;
                }
                else {
                    msg = "Chúc bạn 1 ngày làm việc vui vẻ!"
                }
            }
            else {
                if (res.earlyOut > 0) {
                    msg = "Hôm nay bạn về sớm " + res.earlyOut + " phút."
                }

                msg += "\nSố giờ làm hôm nay của bạn là: " + res.hoursOfWork
            }

            openCheckinAlert({
                header: "Bạn đã " + (res.check === "checkin" ? "checkin thànhcông": "checkout thành công."),
                msg: msg,
                textAlign: "center"
            }, function () {
                jwifi_login_hotspot();
            })
        } else {
            if (res.code == 404) {
                openCheckinAlert({
                    header: "Đăng nhập thất bại!",
                    msg: "Tài khoản chưa có trên hệ thống. Vui lòng kiểm lại thông tin đăng nhập hoặc liên hệ admin.",
                    textAlign: "center"
                })
            }
            else if (res.code == 401) {
                openCheckinAlert({
                    header: "Đăng nhập thất bại!",
                    msg: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm lại thông tin đăng nhập.",
                    textAlign: "center"
                })
            }
            else {
                openCheckinAlert({
                    header: "Đã có lỗi xảy ra!",
                    msg: "Vui lòng thử lại.",
                    textAlign: "center"
                })
            }
        }
        })
        })
        </script>
        <script>
        var today = new Date();
        function currentTime() {
        var date = new Date();
        var h = date.getHours();
        var m = date.getMinutes();
        h = (h < 10) ? "0" + h : h;
        m = (m < 10) ? "0" + m : m;
        var time = h + ":" + m;

        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) {
        dd = '0' + dd;
        }
        if (mm < 10) {
        mm = '0' + mm;
        }
        _today = dd + '/' + mm + '/' + yyyy;

        document.getElementById("currentTime").innerText = time + ' - ' + _today;

        setTimeout(currentTime, 60000);
        }
        function autoResize(id, width, callback) {
        try {
        const isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);
        const bWidth = window.innerWidth;
        const bHeight = window.innerHeight;
        let ratio;
        const el = document.getElementById(id);
        el.style.width = width + 'px';

        const eWidth = width;
        const eHeight = el.offsetHeight;
        if (bWidth > bHeight || bWidth > 768) {
            // Desktop
            ratio = bHeight / eHeight
            if (isFF) el.css({
                '-moz-transform-origin': 'center 0'
            });
        } else {
            // Mobile
            ratio = bWidth / width
            if (isFF) el.css({
                '-moz-transform-origin': '0 0'
            });
            el.style.width = "auto";
        }
        ratio = (ratio > 1 ? 1 : ratio);
        if (!isFF) {
            el.style.zoom = ratio;
        } else {
            el.css({
                '-moz-transform': 'scale(' + ratio + ')'
            });
        }
        if (callback) callback();
        } catch (error) {
        console.error("AUTO-RESIZE ERROR: " + error);
        }
        }
        window.onload = function () {
        autoResize("jwifi_main", 480, function () {
        document.getElementById("jwifi_main").style.visibility = "visible";
        currentTime();
        });
        }
        window.onresize = function () {
        autoResize("jwifi_main", 480);
        }
        </script>
        <!-- Employee -->
        <script>
        if (typeof employee != "undefined" && Object.keys(employee).length) {
        document.getElementById('username').innerText = (employee.nickname ? employee.nickname : employee.name)

        if (employee.avatar) {
        document.getElementById('avatar').setAttribute("src", employee.avatar)
        }

        var birthday = new Date(employee.birthday);

        if (today.getDate() == birthday.getDate() && today.getMonth() == birthday.getMonth()) {
        document.getElementById('frame').style.backgroundImage = "url(/public/checkin/frame_birthday.png)"
        document.getElementById('greeting').innerHTML = "Whoohoo! Today is your birthday."
        }
        } else {
        if (window.location.href.indexOf("mac") != -1) {
        document.getElementById('checkin__wrapper').style.display = 'none'
        document.getElementById('login__wrapper').style.display = 'flex'
        }
        }

        </script>
        <!-- Quote -->
        <script>
        if (typeof quotes != 'undifined') {
        try {
        if (quotes.length > 0) {
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            document.getElementById("quote-content").innerText = quote.content;
            document.getElementById("quote-author").innerText = quote.author;
        }
        } catch (error) { }
        }
        </script>
        <!-- Birthday -->
        <script>
        if (typeof listBirthday != "undefined" && Object.keys(employee).length) {
        try {
        listBirthday.sort((a, b) => {
            return a.count - b.count
        })
        let memberBirthToday = listBirthday.find(i => {
            let dayI = new Date(i.birthday).getDate()
            return today.getDate() == dayI
        })
        if (memberBirthToday) {
            listBirthday.sort(function (x, y) {
                return x._id == memberBirthToday._id ? -1 : y._id == memberBirthToday._id ? 1 : 0;
            });
        }
        var birthdays = document.getElementById('birthdays');
        birthdays.innerHTML = "";
        for (var idx in listBirthday) {
            var count = '<div class="count"></div>';
            var gender = '<div class="gender mars"><i class="fa fa-mars"></i></div>';
            var bday = new Date(listBirthday[idx].birthday);
            if (today.getDate() == bday.getDate()) {
                count = '<div class="count today"><i class="fa fa-birthday-cake"></i></div>';
            }
            else {
                count = '<div class="count coming">' + listBirthday[idx].count + '</div>';
            }
            if (listBirthday[idx].gender == "Female") {
                gender = '<div class="gender venus"><i class="fa fa-venus"></i></div>'
            }

            birthdays.innerHTML += '<div class="user"><div class="left">' + gender + '<div class="avatar">' +
                '<img src="' + (listBirthday[idx].avatar ? listBirthday[idx].avatar : '/public/static/checkin/avatar.png') +
                '" alt="">' +
                '</div></div><div class="meta"><div class="name">' +
                '<span>' + (listBirthday[idx].nickname ? listBirthday[idx].nickname : listBirthday[idx].name) +
                '</span>' +
                count +
                '</div><div class="date"><i class="fa fa-gift" aria-hidden="true"></i>' + listBirthday[idx].birthday.split("-").reverse().join("/") +
                '</div></div></div>';
        }
        } catch (error) { }
        }
        </script>
        <!-- TouchId -->
        <script>
        var timeout = 0;
        var countdown = 1;
        var touchID = document.getElementById("touchID")
        var finger = document.getElementById("fingerAnimation")

        touchID.addEventListener('touchstart', function (event) {
        repeat(event, countdown)
        })
        touchID.addEventListener('mouseup', function (event) {
        repeat(event, countdown)
        })
        touchID.addEventListener('mousedown', function (event) {
        repeat(event, countdown)
        })
        function dateCompare(time1, time2) {
        var t1 = new Date();
        var parts = time1.split(":");
        t1.setHours(parts[0], parts[1], 0, 0);
        var t2 = new Date();
        parts = time2.split(":");
        t2.setHours(parts[0], parts[1], 0, 0);
        // returns 1 if greater, -1 if less and 0 if the same
        if (t1.getTime() > t2.getTime()) return 1;
        if (t1.getTime() < t2.getTime()) return -1;
        return 0;
        }

        async function repeat(event, countdown) {
        try {
        finger.style.height = "80px";
        finger.style.transition = "0.3s";
        if (countdown == 0) {
            if (typeof employee != undefined) {
                jwifi_checkin("", function (res) {
                    if (res) {
                        var msg = "";
                        if (res.check == 'checkin') {
                            if (res.lateIn > 0) {
                                openCheckinAlert({
                                    id: "reasonArriveLateForm",
                                    header: "Hãy cho tôi biết lý do bạn đi trễ hôm nay!",
                                    msg: "Hôm nay bạn đến trễ " + res.lateIn + " phút."
                                })
                                return false;
                            }
                            else {
                                msg = "Chúc bạn 1 ngày làm việc vui vẻ!"
                            }
                        }
                        else {
                            if (res.earlyOut > 0) {
                                msg = "Hôm nay bạn về sớm " + res.earlyOut + " phút."
                            }

                            msg += "\nSố giờ làm hôm nay của bạn là: " + res.hoursOfWork
                        }

                        openCheckinAlert({
                            header: "Bạn đã " + (res.check === "checkin" ? "checkin thànhcông": "checkout thành công."),
                            msg: msg,
                            textAlign: "center"
                        }, function () {
                            jwifi_login_hotspot();
                        })
                    }
                    else {
                        openCheckinAlert({
                            header: "Đã có lỗi xảy ra. Vui lòng thử lại!",
                            msg: "",
                            textAlign: "center"
                        }, function () {
                        })
                    }
                })
            }

            countdown = false;
            clearTimeout(timeout);
            event.stopPropagation();
            return;
        } else {
            openCheckinAlert({
                header: "Bạn đã checkin/checkout thành công!",
                msg: "Checkin/Checkout vào lúc nào thì chúng tôi không biết.",
                textAlign: "center"
            }, function () { })
        }
        } catch (error) {
        console.log(error);
        }
        }
        timeout = setTimeout(function () {
        countdown--;
        // repeat(event, countdown);
        }, 200)

        touchID.addEventListener('touchend', function (event) {
        clearTimeout(timeout);
        if (countdown > 0 && countdown != false) {
        finger.style.height = "0px";
        }
        })
        touchID.addEventListener('mouseup', function (event) {
        clearTimeout(timeout);
        if (countdown > 0 && countdown != false) {
        finger.style.height = "0px";
        }
        })
        touchID.addEventListener('mouseleave', function (event) {
        clearTimeout(timeout);
        if (countdown > 0 && countdown != false) {
        finger.style.height = "0px";
        }
        })
        </script>
        <!-- Reason -->
        <script>
        function onChangeReason(target) {
        if (target.value == "other") {
        document.getElementById('otherReason').disabled = false;
        }
        else {
        document.getElementById('otherReason').disabled = true;
        document.getElementById('otherReason').value = "";
        }
        }
        function onSubmitReasonLate() {
        let reasonVal = document.querySelector('input[name="reason"]:checked').value;
        let reason = reasonVal == 'other' ? document.getElementById("otherReason").value : reasonVal;

        jwifi_checkin(reason, function (res) {
        if (res) {
            closeCheckinAlert("reasonArriveLateForm")
            openCheckinAlert({
                header: "Bạn đã checkin thành công.",
                msg: "Hãy cố gắng đến đúng giờ vào ngày mai nhé.",
                textAlign: "center"
            }, function () {
                jwifi_login_hotspot();
            })
        }
        else {
            openCheckinAlert({
                header: "Đã có lỗi xảy ra. Vui lòng thử lại!",
                msg: "",
                textAlign: "center"
            }, function () {
            })
        }
        })
        }
        </script>
        <!-- Alert -->
        <script>
        window.checkinAlert_callback = {};
        function openCheckinAlert(option, callback) {
        let _popup = document.getElementById(option.id || 'notification');
        if (option) {
        _popup.querySelector(".heading").innerText = option.header || "";
        _popup.querySelector(".message").innerText = option.msg || "";
        }
        _popup.classList.add("open");
        checkinAlert_callback = callback;
        }
        document.getElementById('btnCloseCheckinAlert').addEventListener('click', function (event) {
        closeCheckinAlert()
        })
        function closeCheckinAlert(id, callback) {
        const _popup = document.getElementById(id || 'notification');
        _popup.classList.remove("open");
        if (typeof window.checkinAlert_callback == "function") {
        window.checkinAlert_callback();
        }
        if (callback) callback()
        }
        </script>
        <style type="text/css" media="all">
        #jwifi_main .wrapper .content #login__wrapper .frm .control .label {
        font-size: 24px;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm .control input {
        padding: 8px 15px;
        font-size: 23px;
        }

        #jwifi_main .wrapper .content #login__wrapper .frm button {
        font-size: 23px;
        }
        </style>`,
        landingpage: "http://google.com",
        status: "Active",
        createdBy: "admin",
        splashpage: {
            template: {
                id: "default",
                name: "Default"
            },
            elements: [
                {
                    id: "primary",
                    type: "color",
                    label: "Màu chủ đạo",
                    color: {
                        red: 0,
                        green: 81,
                        blue: 152,
                        alpha: 1,
                        type: "solid",
                        style: "rgba(0, 81, 152, 1)"
                    }
                },
                {
                    id: "bg",
                    type: "gradient",
                    label: "Màu nền",
                    color: {
                        points: [
                            {
                                left: 100,
                                red: 0,
                                green: 81,
                                blue: 152,
                                alpha: 1
                            },
                            {
                                left: 1.7964071856287425,
                                red: 158,
                                green: 0,
                                blue: 144,
                                alpha: 1
                            }
                        ],
                        type: "linear",
                        degree: 0,
                        style: "linear-gradient(0deg,rgba(158, 0, 144, 1) 1.7964071856287425%,rgba(0, 81, 152, 1) 100%)"
                    }
                },
                {
                    id: "logo",
                    type: "image",
                    label: "Logo công ty",
                    path: "/public/campaign/1/logo.png",
                    filename: "logo_company_checkin.png",
                    isShow: true
                }
            ],
            source: {
                layout: "<link rel=\"stylesheet\" href=\"https://checkin.becawifi.vn/public/static/assets/css/font-awesome.min.css\"\n    crossorigin=\"anonymous | use-credentials\">\n<style>\n    :root {\n        --primary-color: rgba(0, 81, 152, 1);\n    }\n\n    * {\n        margin: 0;\n        padding: 0;\n        box-sizing: border-box;\n    }\n\n    button {\n        outline: none;\n    }\n\n    img {\n        width: 100%;\n    }\n\n    p {\n        margin: 0;\n    }\n\n    html,\n    body {\n        height: 100%;\n    }\n\n    body {\n        padding: 0;\n        max-width: 100%;\n        box-sizing: border-box;\n        font-family: Arial, Helvetica, sans-serif;\n    }\n\n    .noselect {\n        -webkit-tap-highlight-color: rgba(255, 255, 255, 0);\n        -webkit-touch-callout: none;\n        -webkit-user-select: none;\n        -khtml-user-select: none;\n        -moz-user-select: none;\n        -ms-user-select: none;\n        user-select: none;\n    }\n\n    #jwifi_main {\n        margin: 0 auto;\n        max-width: 100%;\n        overflow: hidden;\n        height: 100%;\n    }\n\n    #jwifi_main>.wrapper {\n        padding: 0 15px;\n        position: relative;\n        height: 100%;\n    }\n\n    #jwifi_main .wrapper .top {\n        position: relative;\n        padding: 30px 10px;\n        text-align: center;\n        z-index: 200;\n    }\n\n    #jwifi_main .wrapper .top .meta .logo {\n        position: absolute;\n        top: 10px;\n        left: 0;\n        width: 130px;\n        height: 60px;\n    }\n\n    #jwifi_main .wrapper .top .meta .logo img {\n        width: 100%;\n        height: 100%;\n        object-fit: contain;\n        object-position: left;\n    }\n\n\n\n    #jwifi_main .wrapper .top .meta .tool {\n        position: absolute;\n        top: 20px;\n        right: 0;\n        display: flex;\n    }\n\n    #jwifi_main .wrapper .top .meta .tool>div {\n        margin-left: 20px;\n        position: relative;\n    }\n\n    #jwifi_main .wrapper .top .meta .tool>div i {\n        font-size: 18px;\n        color: #fff;\n        cursor: pointer;\n    }\n\n    #jwifi_main .wrapper .top .meta .tool>div .badge {\n        position: absolute;\n        top: 0;\n        right: 0;\n        border-radius: 50%;\n        background: red;\n        color: #fff;\n        padding: 0;\n        width: 8px;\n        height: 8px;\n        font-size: 11px;\n        margin: 0px;\n        display: none;\n    }\n\n    #jwifi_main .wrapper .top .meta .tool>div.active .badge {\n        display: block;\n    }\n\n    #jwifi_main .wrapper>.content {\n        position: relative;\n        margin-top: 0;\n        padding: 20px 15px;\n        height: calc(100% - 90px);\n        overflow: visible;\n    }\n\n    #jwifi_main .wrapper .content .container {\n        width: 100%;\n        height: 100%;\n        background: #fafafa;\n        padding: 0;\n        position: relative;\n        margin: 0;\n        border-radius: 1px;\n        border: 1px solid #eee;\n        display: flex;\n        align-items: center;\n        border-radius: 5px;\n    }\n\n    #jwifi_main .wrapper .content .container .extra {\n        padding: 10px;\n        padding-bottom: 0px;\n        margin-top: 100px;\n        margin-bottom: 50px;\n        width: 100%;\n        height: calc(100% - 145px);\n        overflow-x: hidden;\n        display: flex;\n        flex-direction: column;\n    }\n\n    #jwifi_main div::-webkit-scrollbar {\n        width: 3px;\n    }\n\n    #jwifi_main div::-webkit-scrollbar-track {\n        background: transparent;\n    }\n\n    #jwifi_main div::-webkit-scrollbar-thumb {\n        background: transparent;\n    }\n\n    #jwifi_main div:hover::-webkit-scrollbar-thumb {\n        background: var(--primary-color);\n    }\n\n    #jwifi_main .wrapper>.content:before {\n        content: \"\";\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        width: 100%;\n        height: 85%;\n        background: #fafafa;\n        opacity: 0.5;\n        transform: translate(-50%, -50%);\n        border-radius: 5px;\n    }\n\n    #jwifi_main .wrapper .content .info {\n        position: absolute;\n        top: -61px;\n        z-index: 1000;\n        text-align: center;\n        width: 100%;\n        color: #555;\n    }\n\n    #jwifi_main .wrapper .content .info .avatar {\n        position: relative;\n        width: 120px;\n        height: 120px;\n        background-repeat: no-repeat;\n        background-size: contain;\n        padding: 20px;\n        margin: 0 auto;\n    }\n\n    #jwifi_main .wrapper .content .info .avatar img {\n        position: relative;\n        top: 50%;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        object-fit: cover;\n        transform: translateY(-50%);\n        border-radius: 50%;\n        border: 3px solid #fafafa;\n        z-index: -1;\n        background: #fafafa;\n        overflow: hidden;\n    }\n\n    #jwifi_main .wrapper .content .info .greeting {\n        margin: 0 0 5px 0;\n        color: #555;\n        font-size: 15px;\n    }\n\n    #jwifi_main .wrapper .content .info .date {\n        margin: 0 0 5px 0;\n        color: #555;\n        font-size: 13px;\n        background: #fafafa;\n    }\n\n    #jwifi_main .wrapper .content .menu {\n        position: absolute;\n        bottom: 0;\n        left: 50%;\n        transform: translate(-50%, 50%);\n        width: 100%;\n        display: flex;\n        justify-content: space-between;\n        z-index: 1000;\n    }\n\n    #jwifi_main .wrapper .content .menu>div {\n        width: 35px;\n        height: 35px;\n        background: var(--primary-color);\n        border-radius: 50%;\n        text-align: center;\n        line-height: 35px;\n        color: #fafafa;\n        margin: 0 20px;\n    }\n\n    #jwifi_main .wrapper .content .menu>div>i {\n        line-height: 35px;\n    }\n\n    #jwifi_main .wrapper .content .menu .touch-zone {\n        width: 80px;\n        height: 80px;\n        position: absolute;\n        transform: translate(-50%, -50%);\n        top: 50%;\n        left: 50%;\n        margin: 0;\n        cursor: pointer;\n        background: var(--primary-color);\n    }\n\n    #jwifi_main .wrapper .content .menu .touch-zone .cover {\n        position: absolute;\n        left: 0;\n        bottom: 0;\n        width: 80px;\n        height: 0;\n        overflow: hidden;\n        /* border-radius: 50%; */\n    }\n\n    #jwifi_main .wrapper .content .menu .touch-zone .touch-image {\n        width: 80px;\n        height: 80px;\n        margin: 0;\n        background-image: url(\"/public/static/checkin/touch_id.png\");\n        background-size: 65px;\n        background-repeat: no-repeat;\n        background-position: center;\n        opacity: .5;\n        filter: brightness(5);\n    }\n\n    #jwifi_main .wrapper .content .menu .touch-zone .touch-image-hold {\n        position: absolute;\n        left: 0;\n        bottom: 0;\n        width: 80px;\n        height: 80px;\n        margin: 0;\n        background-image: url(\"/public/static/checkin/touch_id_hold.png\");\n        background-size: 65px;\n        background-repeat: no-repeat;\n        background-position: center;\n        filter: saturate(0);\n    }\n\n    #jwifi_main .wrapper .content .quote {\n        padding: 30px 20px 25px 20px;\n        /* background: #fff; */\n        border-radius: 5px;\n        border: 1px solid #ccc;\n        position: relative;\n        text-align: right;\n        /* overflow: hidden; */\n    }\n\n    #jwifi_main .wrapper .content .quote span {\n        position: absolute;\n        font-size: 25px;\n        color: var(--primary-color);\n        z-index: 49;\n        /* filter: drop-shadow(0px 1px 15px #777); */\n        background: #fafafa;\n        padding: 8px;\n        line-height: 0px;\n        width: 40px;\n        height: 40px;\n        border-radius: 5px;\n    }\n\n    #jwifi_main .wrapper .content .quote span.quote-left {\n        top: -8px;\n        left: -8px;\n    }\n\n    #jwifi_main .wrapper .content .quote span.quote-right {\n        bottom: -8px;\n        right: -8px;\n    }\n\n    #jwifi_main .wrapper .content .quote p {\n        position: relative;\n        z-index: 50;\n        font-size: 14px;\n        font-family: serif;\n        font-style: italic;\n        color: #555;\n        font-weight: bold;\n        line-height: 18px\n    }\n\n    #jwifi_main .wrapper .content .quote p.text {\n        text-align: left;\n    }\n\n    #jwifi_main .wrapper .content .quote p.author {\n        margin-top: 5px;\n        padding: 0 5px;\n        font-weight: 400;\n        position: relative;\n        background: #fafafa;\n        display: inline-block;\n        z-index: 50;\n    }\n\n    #jwifi_main .wrapper .content .quote p.author:before {\n        position: absolute;\n        content: '';\n        width: 8px;\n        height: 1px;\n        background: #555;\n        top: 50%;\n        right: 100%;\n        transform: translateY(-50%);\n    }\n\n    #jwifi_main .wrapper .content .quote p.author:after {\n        position: absolute;\n        content: '';\n        width: 8px;\n        height: 1px;\n        background: #555;\n        top: 50%;\n        left: 100%;\n        transform: translateY(-50%);\n    }\n\n    #jwifi_main .wrapper .content .reason {\n        margin-top: 10px;\n        margin-right: 10px;\n        padding: 15px 10px 10px 10px;\n        border: 1px solid var(--primary-color);\n        border-radius: 5px;\n        position: relative;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-wrapper {\n        max-height: calc(100vh - 410px);\n        overflow-x: hidden;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar {\n        width: 3px;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar-track {\n        background: transparent;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-wrapper::-webkit-scrollbar-thumb {\n        background: transparent;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-wrapper:hover::-webkit-scrollbar-thumb {\n        background: var(--primary-color);\n    }\n\n    #jwifi_main .wrapper .content .reason::before {\n        position: absolute;\n        top: 0;\n        right: 0;\n        padding: 8px;\n        content: \"\\f29c\";\n        font: normal normal normal 40px/1 FontAwesome;\n        background: #fafafa;\n        transform: translate(50%, -50%);\n        color: var(--primary-color);\n        line-height: 35px;\n    }\n\n    #jwifi_main .wrapper .content .reason .reason-heading {\n        position: absolute;\n        top: 0;\n        left: 10px;\n        font-size: 15px;\n        color: #f9af66;\n        background: #fafafa;\n        padding: 10px;\n        transform: translateY(-50%)\n    }\n\n    #jwifi_main .wrapper .content #checkin__wrapper {\n        height: 100%;\n        width: 100%;\n        position: absolute;\n        display: block;\n        background-color: #fafafa;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper {\n        font-size: 14px;\n        line-height: 1.5;\n        color: #555;\n        width: 100%;\n        height: 100%;\n        text-align: center;\n        overflow: hidden;\n        display: flex;\n        flex-direction: column;\n        justify-content: center;\n\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm {\n        text-align: left;\n        width: 90%;\n        margin: 20px auto;\n        border: 1px solid #ccc;\n        padding: 20px;\n        border-radius: 5px;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm .control {\n        margin: 10px 0;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm .control .label {\n        margin-bottom: 10px;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm .control input {\n        width: 100%;\n        padding: 8px 15px;\n        border-radius: 50px;\n        border: 1px solid #ccc;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm button {\n        margin-top: 20px;\n        width: 100%;\n        padding: 8px 15px;\n        font-weight: bold;\n        border-radius: 50px;\n        border: 1px solid #ccc;\n        box-shadow: none;\n    }\n\n    .fake-control input {\n        position: absolute;\n        opacity: 0;\n        cursor: pointer;\n    }\n\n    .checkmark {\n        display: inline-block;\n        line-height: 1;\n        vertical-align: middle;\n    }\n\n    .fake-control:hover input~.checkmark {\n        opacity: .5;\n    }\n\n    .fake-control input:checked~.checkmark {\n        opacity: 1;\n    }\n\n    .fake-control .checkmark:after {\n        font-family: FontAwesome, simple-line-icons;\n        color: var(--main-color);\n        vertical-align: top;\n    }\n\n    .fake-control.radio .checkmark:after {\n        content: \"\\f1db\";\n        font-size: 18px;\n    }\n\n    .fake-control.radio input:checked~.checkmark:after {\n        content: \"\\f192\";\n        color: var(--primary-color);\n    }\n\n    .group-control {\n        margin: 20px 10px;\n        display: flex;\n        align-items: center;\n        color: #555;\n    }\n\n    .group-control .fake-control {\n        margin-right: 20px;\n    }\n\n    .group-control span {\n        font-size: 14px;\n    }\n\n    #jwifi_main .wrapper .content .birthday {\n        flex-direction: column;\n        flex: 1;\n        margin-top: 20px;\n        border: 1px solid #ccc;\n        border-radius: 5px;\n        overflow: hidden;\n        background: #fff;\n    }\n\n    #jwifi_main .wrapper .content .birthday .heading {\n        margin: 0;\n        padding: 10px 17px;\n        text-transform: uppercase;\n        font-size: 14px;\n        color: #5c788e;\n        position: relative;\n        display: flex;\n        align-items: center;\n        background: linear-gradient(90deg, #e9e6e1 60px, #f2f1ed 0);\n    }\n\n    #jwifi_main .wrapper .content .birthday .heading h4 {\n        display: table-cell;\n        vertical-align: middle;\n        width: 100%;\n    }\n\n    #jwifi_main .wrapper .content .birthday .heading i {\n        display: table-cell;\n        vertical-align: middle;\n    }\n\n    #jwifi_main .wrapper .content .birthday .wrapper {\n        overflow-x: hidden;\n        background: linear-gradient(90deg, #e9e6e1 60px, #f2f1ed 0);\n        height: 100%;\n        padding-bottom: 40px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user {\n        text-align: left;\n        display: flex;\n        align-items: center;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left {\n        position: relative;\n        /* background: #e9e6e0; */\n        padding: 2px 5px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user:first-child .left {\n        padding-top: 5px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user:last-child .left {\n        padding-bottom: 5px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .avatar {\n        width: 70px;\n        height: 70px;\n        background: #eee;\n        border: 2px solid #fff;\n        margin: 5px;\n        border-radius: 50%;\n        position: relative;\n        z-index: 100;\n        overflow: hidden;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .avatar img {\n        width: 100%;\n        height: 100%;\n        object-fit: cover;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .name {\n        margin: 0;\n        font-size: 14px;\n        position: relative;\n        z-index: 50;\n        font-weight: bold;\n        color: #ffffff;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .name span {\n        margin: 0;\n        padding: 5px 25px;\n        padding-left: 30px;\n        padding-top: 5px;\n        display: block;\n        font-weight: bold;\n        text-transform: capitalize;\n        color: #fff;\n        font-size: 14px;\n        background: var(--primary-color);\n        width: calc(100% - 15px);\n        opacity: .8;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta {\n        margin-left: -25px;\n        padding-left: 0;\n        padding-right: 5px;\n        width: 100%;\n        margin-top: 10px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .date {\n        color: #8295a3;\n        font-size: 12px;\n        font-weight: bold;\n        padding-left: 30px;\n        margin: 5px 0;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .date i {\n        margin-right: 5px;\n        color: var(--primary-color);\n        font-size: 13px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .gender {\n        position: absolute;\n        bottom: 5px;\n        right: 5px;\n        width: 25px;\n        height: 25px;\n        border-radius: 50%;\n        border: 2px solid #fff;\n        text-align: center;\n        z-index: 101;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .gender i {\n        font-size: 12px;\n        line-height: 22px;\n        color: #fff;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .gender.mars {\n        background: #2196F3\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .left .gender.venus {\n        background: #F06292\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .count {\n        position: absolute;\n        top: 50%;\n        right: 0;\n        width: 35px;\n        height: 35px;\n        background: #777;\n        border-radius: 50%;\n        border: 3px solid #fff;\n        text-align: center;\n        line-height: 30px;\n        transform: translateY(-50%);\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .count i {\n        line-height: 30px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user:not(:last-child) .meta .count:before {\n        content: \"\";\n        position: absolute;\n        top: 100%;\n        left: 50%;\n        width: 5px;\n        height: 70px;\n        background: #fff;\n        transform: translateX(-50%);\n        z-index: -1;\n        border-radius: 15px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user:first-child .meta .count:after {\n        height: 20px;\n        content: \"\";\n        position: absolute;\n        bottom: 100%;\n        left: 50%;\n        width: 5px;\n        background: #fff;\n        transform: translateX(-50%);\n        z-index: -1;\n        border-radius: 15px;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .count.coming {\n        background: #4CAF50;\n    }\n\n    #jwifi_main .wrapper .content .birthday .user .meta .count.today {\n        background: #F44336;\n    }\n\n    #jwifi_main .version {\n        position: absolute;\n        bottom: 0;\n        left: 0;\n        color: #fafafa;\n        font-size: 12px;\n        margin: 2px 5px;\n    }\n\n    .modal {\n        position: absolute;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        visibility: hidden;\n        z-index: 999999;\n    }\n\n    .modal.open {\n        visibility: visible;\n    }\n\n    .modal.open .modal-dialog {\n        z-index: 9999;\n        transform: translate(-50%, -50%) scale(1);\n    }\n\n    .modal .modal-dialog {\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        padding: 20px;\n        background: #fff;\n        width: 90%;\n        min-height: 200px;\n        border-radius: 10px;\n        box-shadow: 0px 4px 18px #00000036;\n        z-index: -1;\n        transform: translate(-50%, -50%) scale(0);\n        transition: .5s cubic-bezier(0.68, -0.55, 0.27, 1.55);\n        border: 1px solid #eee;\n    }\n\n    .modal .modal-dialog .modal-body {\n        text-align: center;\n    }\n\n    .modal .modal-dialog .modal-body img {\n        width: 35%;\n        margin: 0 auto;\n    }\n\n    .modal .modal-dialog .modal-body h4 {\n        margin: 10px;\n        font-size: 16px;\n        color: #f9b859;\n    }\n\n    .modal .modal-dialog .modal-body p {\n        margin-bottom: 1rem;\n        font-size: 13px;\n        color: #999;\n    }\n\n    .modal .modal-dialog .modal-body button.btn-dismiss {\n        background: #f9b859;\n        padding: 8px 10px;\n        border-radius: 15px;\n        color: #fff;\n        border: none;\n        font-weight: bold;\n        cursor: pointer;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate {\n        list-style: none;\n        text-align: left;\n        color: #3071a9;\n        font-size: 14px;\n        font-weight: bold;\n        width: 100%;\n        max-width: 320px;\n        margin: auto;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate li {\n        margin: 10px 0;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate li .radio-group {\n        display: flex;\n        align-items: center;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate li .radio-group input {\n        width: 15px;\n        height: 15px;\n        margin-right: 10px;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate textarea {\n        width: 100%;\n        padding: 10px 20px;\n        margin-bottom: 10px;\n        background: #eee;\n        border: none;\n        border-radius: 10px;\n        resize: none;\n        outline-color: #999;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate textarea:disabled::placeholder {\n        color: #ccc;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate textarea:disabled:-ms-input-placeholder {\n        color: #ccc;\n    }\n\n    #reasonArriveLateForm ul.listReasonLate textarea:disabled::-ms-input-placeholder {\n        color: #ccc;\n    }\n</style>\n<div id=\"jwifi_main\">\n    <div class=\"wrapper\" style=\"background:linear-gradient(0deg,rgba(158, 0, 0, 1) 0.17095060430021367%,rgba(0, 81, 152, 1) 100%)\">\n        <div class=\"top\">\n            <div class=\"meta\">\n                <div class=\"logo\">\n                    <img src=\"/public/campaign/oXHLnUSmjdPpq46vuKf8tS/1652083251468-logo-white-2.png\" alt=\"\">\n                </div>\n            </div>\n        </div>\n        <div class=\"content\">\n            <div class=\"container\">\n                <div id=\"checkin__wrapper\">\n                    <div class=\"info\">\n                        <div id=\"frame\" class=\"avatar\">\n                            <img id=\"avatar\" src=\"/public/static/checkin/avatar.png\" alt=\"\">\n                        </div>\n                        <p class=\"greeting\">\n                            <b>Hi <span id=\"username\">Someone</span></b>. <span id=\"greeting\"> Have\n                                a good day!</span>\n                        </p>\n                        <p class=\"date\">\n                            Today, <b id=\"currentTime\"></b>\n                        </p>\n                    </div>\n                    <div class=\"extra\">\n                        <div id=\"quote\" class=\"quote\">\n                            <span class=\"quote-left\"><i class=\"fa fa-quote-left\" aria-hidden=\"true\"></i></span>\n                            <p id=\"quote-content\" class=\"text noselect\">It's Not a Bug, It's a Feature.</p>\n                            <p id=\"quote-author\" class=\"author\">DEV Community</p>\n                            <span class=\"quote-right\"><i class=\"fa fa-quote-right\" aria-hidden=\"true\"></i></span>\n                        </div>\n                        <div class=\"birthday\">\n                            <div class=\"heading\">\n                                <h4>Upcoming Birthdays</h4>\n                                <i class=\"fa fa-calendar\" aria-hidden=\"true\"></i>\n                            </div>\n                            <div id=\"birthdays\" class=\"wrapper\">\n                                <div class=\"user\">\n                                    <div class=\"left\">\n                                        <div class=\"avatar\">\n                                            <img src=\"/public/static/checkin/avatar.png\" alt=\"\">\n                                        </div>\n                                        <div class=\"gender mars\">\n                                            <i class=\"fa fa-mars\"></i>\n                                        </div>\n                                    </div>\n                                    <div class=\"meta\">\n                                        <div class=\"name\">\n                                            <span>Nickname</span>\n                                            <div class=\"count today\">\n                                                <i class=\"fa fa-birthday-cake\"></i>\n                                            </div>\n                                        </div>\n                                        <div class=\"date\">\n                                            <i class=\"fa fa-gift\" aria-hidden=\"true\"></i>DD-MM-YYYY\n                                        </div>\n                                    </div>\n                                </div>\n                                <div class=\"user\">\n                                    <div class=\"left\">\n                                        <div class=\"avatar\">\n                                            <img src=\"/public/static/checkin/avatar.png\" alt=\"\">\n                                        </div>\n                                        <div class=\"gender venus\">\n                                            <i class=\"fa fa-venus\"></i>\n                                        </div>\n                                    </div>\n                                    <div class=\"meta\">\n                                        <div class=\"name\">\n                                            <span>Nickname</span>\n                                            <div class=\"count coming\">\n                                                02\n                                            </div>\n                                        </div>\n                                        <div class=\"date\">\n                                            <i class=\"fa fa-gift\" aria-hidden=\"true\"></i>DD-MM-YYYY\n                                        </div>\n                                    </div>\n                                </div>\n                                <div class=\"user\">\n                                    <div class=\"left\">\n                                        <div class=\"avatar\">\n                                            <img src=\"/public/static/checkin/avatar.png\" alt=\"\">\n                                        </div>\n                                        <div class=\"gender venus\">\n                                            <i class=\"fa fa-venus\"></i>\n                                        </div>\n                                    </div>\n                                    <div class=\"meta\">\n                                        <div class=\"name\">\n                                            <span>Nickname</span>\n                                            <div class=\"count\">\n                                                <i class=\"fa fa-check\"></i>\n                                            </div>\n                                        </div>\n                                        <div class=\"date\">\n                                            <i class=\"fa fa-gift\" aria-hidden=\"true\"></i>DD-MM-YYYY\n                                        </div>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <p></p>\n                    <div class=\"menu\">\n                        <div id=\"touchID\" class=\"touch-zone noselect\">\n                            <div id=\"fingerAnimation\" class=\"cover noselect\">\n                                <div class=\"touch-image-hold noselect\"></div>\n                            </div>\n                            <div class=\"touch-image noselect\"></div>\n                        </div>\n                    </div>\n                </div>\n                <div id=\"login__wrapper\" style=\"display:none\">\n                    <h2>Không tìm thấy thiết bị!</h2>\n                    <p>Vui lòng đăng nhập hệ thống để lưu thiết bị và chấm công.</p>\n                    <form id=\"frmLogin\" class=\"frm\">\n                        <div class=\"control\">\n                            <h3 class=\"label\">Tên đăng nhập:</h3>\n                            <input id=\"txtUsername\" type=\"text\" autocorrect=\"off\" autocapitalize=\"off\" />\n                        </div>\n                        <div class=\"control\">\n                            <h3 class=\"label\">Mật khẩu:</h3>\n                            <input id=\"txtPassword\" type=\"password\" />\n                        </div>\n                        <button type=\"submit\">ĐĂNG NHẬP</button>\n                    </form>\n                </div>\n            </div>\n        </div>\n        <div class=\"modal\" id=\"notification\">\n            <div class=\"modal-dialog\">\n                <div class=\"modal-content\">\n                    <div class=\"modal-body\">\n                        <img id=\"notification-icon\" src=\"/public/static/checkin/icon_notification.png\"\n                            alt=\"\">\n                        <h4 class=\"heading\">You are have a notification!</h4>\n                        <p class=\"message\"></p>\n                        <p id=\"hidePopup\" hidden>\n                            <input id=\"popup\" type=\"checkbox\" style=\"margin-right:5px\">\n                            <span>Don't show this message again</span>\n                        </p>\n                        <button id=\"btnCloseCheckinAlert\" class=\"btn-dismiss\">Đóng</button>\n                    </div>\n                </div>\n            </div>\n        </div>\n        <div class=\"modal\" id=\"reasonArriveLateForm\">\n            <div class=\"modal-dialog\">\n                <div class=\"modal-content\">\n                    <div class=\"modal-body\">\n                        <img id=\"notification-icon\"\n                            src=\"https://ads.becawifi.vn/public/campaign/2/1655102154759-quicktime-04-ai.png\" alt=\"\">\n                        <p class=\"message\" style=\"margin: 5px 0;\"></p>\n                        <h4 class=\"heading\"></h4>\n                        <ul class=\"listReasonLate\">\n                            <li>\n                                <label class=\"radio-group\">\n                                    <input type=\"radio\" name=\"reason\" onchange=\"onChangeReason(this)\" value=\"Kẹt xe\"\n                                        checked /> Kẹt xe\n                                </label>\n                            </li>\n                            <li>\n                                <label class=\"radio-group\">\n                                    <input type=\"radio\" name=\"reason\" onchange=\"onChangeReason(this)\" value=\"Xe hỏng\" />\n                                    Xe hỏng\n                                </label>\n                            </li>\n                            <li>\n                                <label class=\"radio-group\">\n                                    <input type=\"radio\" name=\"reason\" onchange=\"onChangeReason(this)\" value=\"Dậy trễ\" />\n                                    Dậy trễ\n                                </label>\n                            </li>\n                            <li>\n                                <label class=\"radio-group\">\n                                    <input type=\"radio\" name=\"reason\" onchange=\"onChangeReason(this)\" value=\"other\" />\n                                    Khác\n                                </label>\n                            </li>\n                            <li>\n                                <textarea id=\"otherReason\" rows=\"5\" placeholder=\"Tối đa 150 ký tự.\" disabled></textarea>\n                            </li>\n                        </ul>\n                        <div><button type=\"button\" onclick=\"onSubmitReasonLate()\" class=\"btn-dismiss\">Gửi lên</button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n        <div class=\"version\">\n            Verion 1.3.1\n        </div>\n    </div>\n</div>\n<script>\n    // function autoLowercaseText() {\n    //     let username = document.getElementById(\"txtUsername\").value\n    //     if(username)\n    //         document.getElementById(\"txtUsername\").value = username.toLowerCase()\n    // }\n    document.getElementById(\"frmLogin\").addEventListener(\"submit\", function (event) {\n        event.preventDefault();\n        let username = document.getElementById(\"txtUsername\").value.replace(' ', '').toLowerCase()\n        let password = document.getElementById(\"txtPassword\").value.toLowerCase()\n        if (username == \"\") {\n            openCheckinAlert({\n                header: \"Đã có lỗi xảy ra!\",\n                msg: \"Vui lòng nhập tên đăng nhập.\",\n                textAlign: \"center\"\n            })\n            return\n        }\n        if (password == \"\") {\n            openCheckinAlert({\n                header: \"Đã có lỗi xảy ra!\",\n                msg: \"Vui lòng nhập mật khẩu.\",\n                textAlign: \"center\"\n            })\n            return\n        }\n        jwifi_checkin_bypass(username, password, function (res) {\n            if (res.status) {\n                var msg = \"\";\n                if (res.check == \"checkin\") {\n                    if (res.lateIn > 0) {\n                        openCheckinAlert({\n                            id: \"reasonArriveLateForm\",\n                            header: \"Hãy cho tôi biết lý do bạn đi trễ hôm nay!\",\n                            msg: \"Hôm nay bạn đến trễ \" + res.lateIn + \" phút.\"\n                        })\n                        return false;\n                    }\n                    else {\n                        msg = \"Chúc bạn 1 ngày làm việc vui vẻ!\"\n                    }\n                }\n                else {\n                    if (res.earlyOut > 0) {\n                        msg = \"Hôm nay bạn về sớm \" + res.earlyOut + \" phút.\"\n                    }\n\n                    msg += \"\\nSố giờ làm hôm nay của bạn là: \" + res.hoursOfWork\n                }\n\n                openCheckinAlert({\n                    header: \"Bạn đã \" + (res.check === \"checkin\" ? \"checkin thànhcông\": \"checkout thành công.\"),\n                    msg: msg,\n                    textAlign: \"center\"\n                }, function () {\n                    jwifi_login_hotspot();\n                })\n            } else {\n                if (res.code == 404) {\n                    openCheckinAlert({\n                        header: \"Đăng nhập thất bại!\",\n                        msg: \"Tài khoản chưa có trên hệ thống. Vui lòng kiểm lại thông tin đăng nhập hoặc liên hệ admin.\",\n                        textAlign: \"center\"\n                    })\n                }\n                else if (res.code == 401) {\n                    openCheckinAlert({\n                        header: \"Đăng nhập thất bại!\",\n                        msg: \"Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm lại thông tin đăng nhập.\",\n                        textAlign: \"center\"\n                    })\n                }\n                else {\n                    openCheckinAlert({\n                        header: \"Đã có lỗi xảy ra!\",\n                        msg: \"Vui lòng thử lại.\",\n                        textAlign: \"center\"\n                    })\n                }\n            }\n        })\n    })\n</script>\n<script>\n    var today = new Date();\n    function currentTime() {\n        var date = new Date();\n        var h = date.getHours();\n        var m = date.getMinutes();\n        h = (h < 10) ? \"0\" + h : h;\n        m = (m < 10) ? \"0\" + m : m;\n        var time = h + \":\" + m;\n\n        var dd = today.getDate();\n        var mm = today.getMonth() + 1; //January is 0!\n\n        var yyyy = today.getFullYear();\n        if (dd < 10) {\n            dd = '0' + dd;\n        }\n        if (mm < 10) {\n            mm = '0' + mm;\n        }\n        _today = dd + '/' + mm + '/' + yyyy;\n\n        document.getElementById(\"currentTime\").innerText = time + ' - ' + _today;\n\n        setTimeout(currentTime, 60000);\n    }\n    function autoResize(id, width, callback) {\n        try {\n            const isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);\n            const bWidth = window.innerWidth;\n            const bHeight = window.innerHeight;\n            let ratio;\n            const el = document.getElementById(id);\n            el.style.width = width + 'px';\n\n            const eWidth = width;\n            const eHeight = el.offsetHeight;\n            if (bWidth > bHeight || bWidth > 768) {\n                // Desktop\n                ratio = bHeight / eHeight\n                if (isFF) el.css({\n                    '-moz-transform-origin': 'center 0'\n                });\n            } else {\n                // Mobile\n                ratio = bWidth / width\n                if (isFF) el.css({\n                    '-moz-transform-origin': '0 0'\n                });\n                el.style.width = \"auto\";\n            }\n            ratio = (ratio > 1 ? 1 : ratio);\n            if (!isFF) {\n                el.style.zoom = ratio;\n            } else {\n                el.css({\n                    '-moz-transform': 'scale(' + ratio + ')'\n                });\n            }\n            if (callback) callback();\n        } catch (error) {\n            console.error(\"AUTO-RESIZE ERROR: \" + error);\n        }\n    }\n    window.onload = function () {\n        autoResize(\"jwifi_main\", 480, function () {\n            document.getElementById(\"jwifi_main\").style.visibility = \"visible\";\n            currentTime();\n        });\n    }\n    window.onresize = function () {\n        autoResize(\"jwifi_main\", 480);\n    }\n</script>\n<!-- Employee -->\n<script>\n    if (typeof employee != \"undefined\" && Object.keys(employee).length) {\n        document.getElementById('username').innerText = (employee.nickname ? employee.nickname : employee.name)\n\n        if (employee.avatar) {\n            document.getElementById('avatar').setAttribute(\"src\", employee.avatar)\n        }\n\n        var birthday = new Date(employee.birthday);\n\n        if (today.getDate() == birthday.getDate() && today.getMonth() == birthday.getMonth()) {\n            document.getElementById('frame').style.backgroundImage = \"url(/public/checkin/frame_birthday.png)\"\n            document.getElementById('greeting').innerHTML = \"Whoohoo! Today is your birthday.\"\n        }\n    } else {\n        if (window.location.href.indexOf(\"mac\") != -1) {\n            document.getElementById('checkin__wrapper').style.display = 'none'\n            document.getElementById('login__wrapper').style.display = 'flex'\n        }\n    }\n\n</script>\n<!-- Quote -->\n<script>\n    if (typeof quotes != 'undifined') {\n        try {\n            if (quotes.length > 0) {\n                const quote = quotes[Math.floor(Math.random() * quotes.length)];\n                document.getElementById(\"quote-content\").innerText = quote.content;\n                document.getElementById(\"quote-author\").innerText = quote.author;\n            }\n        } catch (error) { }\n    }\n</script>\n<!-- Birthday -->\n<script>\n    if (typeof listBirthday != \"undefined\" && Object.keys(employee).length) {\n        try {\n            listBirthday.sort((a, b) => {\n                return a.count - b.count\n            })\n            let memberBirthToday = listBirthday.find(i => {\n                let dayI = new Date(i.birthday).getDate()\n                return today.getDate() == dayI\n            })\n            if (memberBirthToday) {\n                listBirthday.sort(function (x, y) {\n                    return x._id == memberBirthToday._id ? -1 : y._id == memberBirthToday._id ? 1 : 0;\n                });\n            }\n            var birthdays = document.getElementById('birthdays');\n            birthdays.innerHTML = \"\";\n            for (var idx in listBirthday) {\n                var count = '<div class=\"count\"></div>';\n                var gender = '<div class=\"gender mars\"><i class=\"fa fa-mars\"></i></div>';\n                var bday = new Date(listBirthday[idx].birthday);\n                if (today.getDate() == bday.getDate()) {\n                    count = '<div class=\"count today\"><i class=\"fa fa-birthday-cake\"></i></div>';\n                }\n                else {\n                    count = '<div class=\"count coming\">' + listBirthday[idx].count + '</div>';\n                }\n                if (listBirthday[idx].gender == \"Female\") {\n                    gender = '<div class=\"gender venus\"><i class=\"fa fa-venus\"></i></div>'\n                }\n\n                birthdays.innerHTML += '<div class=\"user\"><div class=\"left\">' + gender + '<div class=\"avatar\">' +\n                    '<img src=\"' + (listBirthday[idx].avatar ? listBirthday[idx].avatar : '/public/static/checkin/avatar.png') +\n                    '\" alt=\"\">' +\n                    '</div></div><div class=\"meta\"><div class=\"name\">' +\n                    '<span>' + (listBirthday[idx].nickname ? listBirthday[idx].nickname : listBirthday[idx].name) +\n                    '</span>' +\n                    count +\n                    '</div><div class=\"date\"><i class=\"fa fa-gift\" aria-hidden=\"true\"></i>' + listBirthday[idx].birthday.split(\"-\").reverse().join(\"/\") +\n                    '</div></div></div>';\n            }\n        } catch (error) { }\n    }\n</script>\n<!-- TouchId -->\n<script>\n    var timeout = 0;\n    var countdown = 1;\n    var touchID = document.getElementById(\"touchID\")\n    var finger = document.getElementById(\"fingerAnimation\")\n\n    touchID.addEventListener('touchstart', function (event) {\n        repeat(event, countdown)\n    })\n    touchID.addEventListener('mouseup', function (event) {\n        repeat(event, countdown)\n    })\n    touchID.addEventListener('mousedown', function (event) {\n        repeat(event, countdown)\n    })\n    function dateCompare(time1, time2) {\n        var t1 = new Date();\n        var parts = time1.split(\":\");\n        t1.setHours(parts[0], parts[1], 0, 0);\n        var t2 = new Date();\n        parts = time2.split(\":\");\n        t2.setHours(parts[0], parts[1], 0, 0);\n        // returns 1 if greater, -1 if less and 0 if the same\n        if (t1.getTime() > t2.getTime()) return 1;\n        if (t1.getTime() < t2.getTime()) return -1;\n        return 0;\n    }\n\n    async function repeat(event, countdown) {\n        try {\n            finger.style.height = \"80px\";\n            finger.style.transition = \"0.3s\";\n            if (countdown == 0) {\n                if (typeof employee != undefined) {\n                    jwifi_checkin(\"\", function (res) {\n                        if (res) {\n                            var msg = \"\";\n                            if (res.check == 'checkin') {\n                                if (res.lateIn > 0) {\n                                    openCheckinAlert({\n                                        id: \"reasonArriveLateForm\",\n                                        header: \"Hãy cho tôi biết lý do bạn đi trễ hôm nay!\",\n                                        msg: \"Hôm nay bạn đến trễ \" + res.lateIn + \" phút.\"\n                                    })\n                                    return false;\n                                }\n                                else {\n                                    msg = \"Chúc bạn 1 ngày làm việc vui vẻ!\"\n                                }\n                            }\n                            else {\n                                if (res.earlyOut > 0) {\n                                    msg = \"Hôm nay bạn về sớm \" + res.earlyOut + \" phút.\"\n                                }\n\n                                msg += \"\\nSố giờ làm hôm nay của bạn là: \" + res.hoursOfWork\n                            }\n\n                            openCheckinAlert({\n                                header: \"Bạn đã \" + (res.check === \"checkin\" ? \"checkin thànhcông\": \"checkout thành công.\"),\n                                msg: msg,\n                                textAlign: \"center\"\n                            }, function () {\n                                jwifi_login_hotspot();\n                            })\n                        }\n                        else {\n                            openCheckinAlert({\n                                header: \"Đã có lỗi xảy ra. Vui lòng thử lại!\",\n                                msg: \"\",\n                                textAlign: \"center\"\n                            }, function () {\n                            })\n                        }\n                    })\n                }\n\n                countdown = false;\n                clearTimeout(timeout);\n                event.stopPropagation();\n                return;\n            } else {\n                openCheckinAlert({\n                    header: \"Bạn đã checkin/checkout thành công!\",\n                    msg: \"Checkin/Checkout vào lúc nào thì chúng tôi không biết.\",\n                    textAlign: \"center\"\n                }, function () { })\n            }\n        } catch (error) {\n            console.log(error);\n        }\n    }\n    timeout = setTimeout(function () {\n        countdown--;\n        // repeat(event, countdown);\n    }, 200)\n\n    touchID.addEventListener('touchend', function (event) {\n        clearTimeout(timeout);\n        if (countdown > 0 && countdown != false) {\n            finger.style.height = \"0px\";\n        }\n    })\n    touchID.addEventListener('mouseup', function (event) {\n        clearTimeout(timeout);\n        if (countdown > 0 && countdown != false) {\n            finger.style.height = \"0px\";\n        }\n    })\n    touchID.addEventListener('mouseleave', function (event) {\n        clearTimeout(timeout);\n        if (countdown > 0 && countdown != false) {\n            finger.style.height = \"0px\";\n        }\n    })\n</script>\n<!-- Reason -->\n<script>\n    function onChangeReason(target) {\n        if (target.value == \"other\") {\n            document.getElementById('otherReason').disabled = false;\n        }\n        else {\n            document.getElementById('otherReason').disabled = true;\n            document.getElementById('otherReason').value = \"\";\n        }\n    }\n    function onSubmitReasonLate() {\n        let reasonVal = document.querySelector('input[name=\"reason\"]:checked').value;\n        let reason = reasonVal == 'other' ? document.getElementById(\"otherReason\").value : reasonVal;\n\n        jwifi_checkin(reason, function (res) {\n            if (res) {\n                closeCheckinAlert(\"reasonArriveLateForm\")\n                openCheckinAlert({\n                    header: \"Bạn đã checkin thành công.\",\n                    msg: \"Hãy cố gắng đến đúng giờ vào ngày mai nhé.\",\n                    textAlign: \"center\"\n                }, function () {\n                    jwifi_login_hotspot();\n                })\n            }\n            else {\n                openCheckinAlert({\n                    header: \"Đã có lỗi xảy ra. Vui lòng thử lại!\",\n                    msg: \"\",\n                    textAlign: \"center\"\n                }, function () {\n                })\n            }\n        })\n    }\n</script>\n<!-- Alert -->\n<script>\n    window.checkinAlert_callback = {};\n    function openCheckinAlert(option, callback) {\n        let _popup = document.getElementById(option.id || 'notification');\n        if (option) {\n            _popup.querySelector(\".heading\").innerText = option.header || \"\";\n            _popup.querySelector(\".message\").innerText = option.msg || \"\";\n        }\n        _popup.classList.add(\"open\");\n        checkinAlert_callback = callback;\n    }\n    document.getElementById('btnCloseCheckinAlert').addEventListener('click', function (event) {\n        closeCheckinAlert()\n    })\n    function closeCheckinAlert(id, callback) {\n        const _popup = document.getElementById(id || 'notification');\n        _popup.classList.remove(\"open\");\n        if (typeof window.checkinAlert_callback == \"function\") {\n            window.checkinAlert_callback();\n        }\n        if (callback) callback()\n    }\n</script>",
                custom: "<style type=\"text/css\" media=\"all\">\n    #jwifi_main .wrapper .content #login__wrapper .frm .control .label {\n        font-size: 24px;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm .control input {\n        padding: 8px 15px;\n        font-size: 23px;\n    }\n\n    #jwifi_main .wrapper .content #login__wrapper .frm button {\n        font-size: 23px;\n    }\n</style>"
            }
        },
        default: true
    },
    LANDINGPAGE: "http://becamex.com.vn/",
    AVATAR: __ + "../../../checkin-media/avatar/",
    AVATAR_REMOTE: __ + "../../../checkin-media-remote/avatar/",
    PORTRAIT: __ + "../../../checkin-media/portrait/",
    PORTRAIT_REMOTE: __ + "../../../checkin-media-remote/portrait/",
    PORTRAIT2: __ + "../../../checkin-media/portrait2/",
    PORTRAIT2_REMOTE: __ + "../../../checkin-media-remote/portrait2/",
    MISC: __ + "../../../checkin-media/misc/",
    MISC_REMOTE: __ + "../../../checkin-media-remote/misc/",
    SELFIE: __ + "../../../checkin-media/selfie/",
    SELFIE_REMOTE: __ + "../../../checkin-media-remote/selfie/",
    MEDIA: __ + "../../../checkin-media",
    MEDIA_REMOTE: __ + "../../../checkin-media-remote",
    FACEID: __ + "../../../checkin-media/faceId/",
    EXPORT: __ + "../../../checkin-media/export/",
    SECRET: "jwifi",
    EXPIRED: "7d",
    ROLE: {
        Admin: [
            "DASHBOARD_READ", "DASHBOARD_CREATE",
            "AP_READ", "AP_CREATE", "AP_UPDATE", "AP_DELETE",
            "SCANNER_READ", "SCANNER_CREATE", "SCANNER_UPDATE", "SCANNER_DELETE",
            "LOCATION_READ", "LOCATION_CREATE", "LOCATION_UPDATE", "LOCATION_DELETE",
            "GROUP_READ", "GROUP_CREATE", "GROUP_UPDATE", "GROUP_DELETE",
            "USER_READ", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
            "CHECKIN_READ", "CHECKIN_CREATE", "CHECKIN_UPDATE", "CHECKIN_DELETE",
            "UPLOAD_READ", "UPLOAD_CREATE", "UPLOAD_UPDATE", "UPLOAD_DELETE",
            "EMPLOYEE_READ", "EMPLOYEE_CREATE", "EMPLOYEE_UPDATE", "EMPLOYEE_DELETE",
            "GUEST_READ", "GUEST_CREATE", "GUEST_UPDATE", "GUEST_DELETE",
            "SETTING_READ", "SETTING_CREATE", "SETTING_UPDATE", "SETTING_DELETE",
            "POLICY_READ", "POLICY_CREATE", "POLICY_UPDATE", "POLICY_DELETE",
            "BUSINESS_READ", "BUSINESS_CREATE", "BUSINESS_UPDATE", "BUSINESS_DELETE",
            "TIMESHEET_READ", "TIMESHEET_CREATE", "TIMESHEET_UPDATE", "TIMESHEET_DELETE",
            "LOA_READ", "LOA_UPDATE", "LOA_DELETE",
            "GROUPTYPE_READ",
            "SHIFT_READ", "SHIFT_CREATE", "SHIFT_UPDATE", "SHIFT_DELETE",
            "HIKCENTRAL_READ", "HIKCENTRAL_CREATE", "HIKCENTRAL_UPDATE", "HIKCENTRAL_DELETE",
            "PROFILE_READ",
            "PORTRAIT_READ", "PORTRAIT_CREATE", "PORTRAIT_UPDATE", "PORTRAIT_DELETE",
            "PLAN_READ", "PLAN_CREATE", "PLAN_UPDATE"
        ],
        Manager: [
            "DASHBOARD_READ", "DASHBOARD_CREATE",
            "AP_READ", "AP_CREATE", "AP_UPDATE", "AP_DELETE",
            "SCANNER_READ", "SCANNER_CREATE", "SCANNER_UPDATE", "SCANNER_DELETE",
            "LOCATION_READ", "LOCATION_CREATE", "LOCATION_UPDATE", "LOCATION_DELETE",
            "UPLOAD_READ", "UPLOAD_CREATE", "UPLOAD_UPDATE", "UPLOAD_DELETE",
            "EMPLOYEE_READ", "EMPLOYEE_CREATE", "EMPLOYEE_UPDATE", "EMPLOYEE_DELETE",
            "GUEST_READ", "GUEST_CREATE", "GUEST_UPDATE", "GUEST_DELETE",
            "CHECKIN_READ", "CHECKIN_CREATE", "CHECKIN_UPDATE", "CHECKIN_DELETE",
            "SETTING_READ", "SETTING_CREATE", "SETTING_UPDATE", "SETTING_DELETE",
            "POLICY_READ", "POLICY_CREATE", "POLICY_UPDATE", "POLICY_DELETE",
            "BUSINESS_READ", "BUSINESS_CREATE", "BUSINESS_UPDATE", "BUSINESS_DELETE",
            "TIMESHEET_READ", "TIMESHEET_CREATE", "TIMESHEET_UPDATE", "TIMESHEET_DELETE",
            "LOA_READ", "LOA_UPDATE", "LOA_DELETE",
            "SHIFT_READ", "SHIFT_CREATE", "SHIFT_UPDATE", "SHIFT_DELETE",
            "HIKCENTRAL_READ", "HIKCENTRAL_CREATE", "HIKCENTRAL_UPDATE", "HIKCENTRAL_DELETE",
            "PROFILE_READ",
            "PORTRAIT_READ", "PORTRAIT_CREATE", "PORTRAIT_UPDATE", "PORTRAIT_DELETE",
            "PLAN_READ", "PLAN_CREATE", "PLAN_UPDATE"
        ],
        Viewer: [
            "DASHBOARD_READ",
            "AP_READ", ,
            "SCANNER_READ",
            "LOCATION_READ",
            "UPLOAD_READ",
            "EMPLOYEE_READ",
            "CHECKIN_READ",
            "SETTING_READ",
            "POLICY_READ",
            "TIMESHEET_READ",
            "LOA_READ",
            "SHIFT_READ",
            "HIKCENTRAL_READ",
            "PROFILE_READ",
        ],
        Employee: [
            "DASHBOARD_READ",
            "PROFILE_READ", "PROFILE_UPDATE"
        ],
        Owner: [
            "DASHBOARD_READ",
            "PROFILE_READ", "PROFILE_UPDATE",
            
            "SHIFT_READ",
            "EMPLOYEE_READ",
            "TIMESHEET_READ",
            "SETTING_READ",
            "POLICY_READ",
            "PLAN_READ", "PLAN_CREATE", "PLAN_UPDATE"
        ]
    },
    APIROUTER: ["account", "ap", "appinfo", "business", "category", "check", "checkin", "city", "dashboard", "employee", "guest", "group", "hello", "hikcentral", "hikevent", "loa", "location", "policy", "portrait", "profile", "qr", "quote", "scanner", "shift", "timesheet", "plan", "upload", "user"],
    authPORT: 1812,
    acctPORT: 1813,
    PROXY: {
        SECRET: 'testing123',
        PORT_AUTH: 1812,
        PORT_ACCT: 1813,
        IP1: "45.118.139.111",
        IP1: "45.118.139.112"
    },
    HIK_API: {
        url: "https://becacheckin-srv.becawifi.vn:4500",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiUVJJRCIsImlhdCI6MTY2MjM2NDcwOH0.tXWGGdH46t6qYrIOXrAxxwNQEQfwd23FSWg-qwa5Kgk"
    },
    HIK_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    FIBASE_KEY: "key=AAAASxkckS0:APA91bFLJ8lCghL3ne3bkAyLiCH1tnEIVrsgWQESyVNZdZXcpsSR5Kkkj4QaGKHK0oVoG806jv8RlgvCvkR6xWlrqWVkyG73J64o-dyLTBdKOl4vWFOM4GCidloY5PMEsN5xLPFMq1gs",
    BECAWORK: {
        METHOD: { //1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
            gps: 1, gpsimage: 1,
            wifi: 2,
            bssid: 3,
            qrcode: 4, qr: 4,
            faceId: 5, hik: 5
        },
        CHECK: { //1:in, 2: out
            checkin: 1,
            checkout: 2
        },
    },
}
