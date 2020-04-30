// TODO 修改代码运行服务器地址，添加附加功能的web服务地址
let defaultUrl = localStorageGetItem("api-url") || "http://10.0.0.3:3000";
let dataindustryUrl = localStorageGetItem("dataindustry-api-url") || "http://10.0.0.3:4321";
// END

let apiUrl = defaultUrl;
let wait = localStorageGetItem("wait") || false;
const pbUrl = "https://pb.judge0.com";
const check_timeout = 200;

let blinkStatusLine = ((localStorageGetItem("blink") || "true") === "true");
let editorMode = localStorageGetItem("editorMode") || "normal";

let fontSize = 14;

let layout;

let sourceEditor;
let stdinEditor;
let stdoutEditor;
let stderrEditor;
let compileOutputEditor;
let sandboxMessageEditor;

let isEditorDirty = false;
let currentLanguageId;

let $selectLanguage;
let $compilerOptions;
let $commandLineArguments;
let $insertTemplateBtn;
let $runBtn;

// TODO 界面元素变量定义
let descriptionMarkdownEditor;
let descriptionHtmlPreviewer;

let $submitBtn;
let $publishBtn;
let $loginBtn;
let $registerBtn;
let $menuLoginBtn;
let $cancelBtn;

// TODO 下拉列表的三个联动组件
let $selectedProgramKeyInput;
let $programMenu;
let $programHeader;

// TODO 本地状态变量
let $username;
let $password;
let $userProfile;

let $program;
let $programs;

let $selectedProgramKey;
let $prevLanguageId;
// END

let $navigationMessage;
let $about;
let $statusLine;

let timeStart;
let timeEnd;

let messagesData;

let layoutConfig = {
    settings: {
        showPopoutIcon: false,
        reorderEnabled: true
    },
    dimensions: {
        borderWidth: 3,
        headerHeight: 22
    },
    content: [{
        type: "row",
        content: [{
            type: "component",
            componentName: "source",
            title: "SOURCE",
            isClosable: false,
            componentState: {
                readOnly: false
            }
        }, {
            type: "column",
            content:
                [
                    {
                        type: "stack",
                        content: [
                            // TODO 修改布局，加入descriptionMarkdown与descriptionHtml区域
                            {
                                type: "component",
                                componentName: "descriptionHtml",
                                title: "DESCRIPTION HTML Previewer",
                                isClosable: false,
                                cssClass: 'scrollable',
                                componentState: {
                                    readOnly: false
                                }
                            },
                            {
                                type: "component",
                                componentName: "descriptionMarkdown",
                                title: "DESCRIPTION Markdown Editor",
                                isClosable: false,
                                componentState: {
                                    readOnly: false
                                }
                            }
                            // END
                        ]
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                componentName: "stdin",
                                title: "STDIN",
                                isClosable: false,
                                componentState: {
                                    readOnly: false
                                }
                            }
                        ]
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                componentName: "stdout",
                                title: "STDOUT",
                                isClosable: false,
                                componentState: {
                                    readOnly: true
                                }
                            }, {
                                type: "component",
                                componentName: "stderr",
                                title: "STDERR",
                                isClosable: false,
                                componentState: {
                                    readOnly: true
                                }
                            }, {
                                type: "component",
                                componentName: "compile output",
                                title: "COMPILE OUTPUT",
                                isClosable: false,
                                componentState: {
                                    readOnly: true
                                }
                            }, {
                                type: "component",
                                componentName: "sandbox message",
                                title: "SANDBOX MESSAGE",
                                isClosable: false,
                                componentState: {
                                    readOnly: true
                                }
                            }]
                    }
                ]
        }]
    }]
};

// TODO 初始化所有本地变量
function doInitialize() {

    // 清除所有本地变量
    $username = "";
    $password = "";
    $userProfile = null;
    $program = null;
    $programs = new Map;
    $prevLanguageId = "";

    stdoutEditor.setValue("");
    stderrEditor.setValue("");
    compileOutputEditor.setValue("");
    sandboxMessageEditor.setValue("");
    stdinEditor.setValue("");
    sourceEditor.setValue("");

    $compilerOptions.val("");
    $commandLineArguments.val("");

}

// TODO 格式化当前日期
Date.prototype.Format = function (fmt) {
    let o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "H+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt =
            fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

// TODO 逻辑空值检测
function isLogicEmpty(target_object) {
    return target_object === undefined ||
        target_object === null ||
        target_object.trim() === "";
}

// TODO 显示模态窗口
function showLoginModal() {
    $("#login-modal").modal("show");
}

// TODO 隐藏模态窗口
function hideLoginModal() {
    $("#login-modal").modal("hide");
}

// TODO 生成program key
function encodeProgramKey(program_no, language_id) {
    return program_no + "/" + language_id;
}

// TODO 解码program key
function decodeProgramKey(programKey) {

    if (
        programKey !== undefined &&
        programKey !== null &&
        programKey.trim() !== "" &&
        programKey.indexOf("/") !== -1) {
        return programKey.split("/");
    } else {
        return null;
    }

}

// TODO 将界面上的数据打包到PROGRAM里面
function packageUIToData() {

    if ($program === undefined || $program === null) {
        $program = {};
    }

    if ($userProfile !== undefined && $userProfile !== null) {
        $program["program_no"] = decodeProgramKey($selectedProgramKeyInput.val())[0];
    }

    $program["stdin"] = encode(stdinEditor.getValue());
    $program["language_id"] = resolveLanguageId($selectLanguage.val());

    if (parseInt($program["language_id"]) === 44) {
        $program["source_code"] = sourceEditor.getValue();
    } else {
        $program["source_code"] = encode(sourceEditor.getValue());
    }

    $program["description"] = encode(descriptionMarkdownEditor.getValue());
    $program["compiler_options"] = $compilerOptions.val();
    $program["command_line_arguments"] = $commandLineArguments.val();

    return $program;
}

// TODO 将PROGRAM中的数值反映到界面上
function applyDataToUI(isDrivenSelectLanguage) {

    stdoutEditor.setValue("");
    stderrEditor.setValue("");
    compileOutputEditor.setValue("");
    sandboxMessageEditor.setValue("");

    sourceEditor.setValue(decode($program.source_code));

    stdinEditor.setValue(decode($program.stdin));

    descriptionMarkdownEditor.setValue(decode($program.description));

    // descriptionHtmlPreviewer.html("<div style='margin: 10px; padding: 0px'>" + decode($program.description_html) + "</div>");
    // descriptionHtmlPreviewer.html(decode($program.description_html));

    $compilerOptions.val($program.compiler_options);
    $commandLineArguments.val($program.command_line_arguments);

    if (isDrivenSelectLanguage)
        $selectLanguage.dropdown("set selected", $program.language_id);

    changeEditorLanguage();
}

// TODO 新建一个PROGRAM
function createNewProgram() {

    let newProgram = {};

    newProgram["program_no"] = decodeProgramKey($selectedProgramKeyInput.val())[0];
    newProgram["user_profile_oid"] = $userProfile._id.oid;
    newProgram["command_line_arguments"] = "";
    newProgram["compiler_options"] = "";
    newProgram["language_id"] = resolveLanguageId($selectLanguage.val());
    newProgram["source_code"] = encode(sources[newProgram["language_id"]]);
    newProgram["description"] = encode(descriptionMarkdownEditor.getValue());
    newProgram["compiler_options"] = "";
    newProgram["stdin"] = "";

    return newProgram;
}

// TODO 登陆逻辑
function doLogin() {

    doInitialize();

    $username = $("#username");
    $password = $("#password");

    if (isLogicEmpty($username.val()) || isLogicEmpty($password.val())) {
        alert("username and password can not be empty.");
        return;
    }

    $.ajax({
        url: dataindustryUrl + "/user_profile/" +
            encode($username.val().trim()) + "/" +
            encode($password.val().trim()),
        type: "GET",
        headers: {"Accept": "application/json"},
        dataType: 'json',
        success: function (data, textStatus, jqXHR) {

            $userProfile = data;

            $("#username-label")[0].innerText = decode($userProfile.username);

            $("#menu-login-btn-panel").hide();
            $("#username-label-panel").show();
            $("#program-menu-panel").show();

            if ($userProfile.user_type === 0) {

                $("#submit-btn-panel").show();
                $("#publish-btn-panel").hide();

            } else if ($userProfile.user_type === 1) {

                $("#submit-btn-panel").hide();
                $("#publish-btn-panel").show();

            }

            makeProgramMenu();

            hideLoginModal();

        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(jqXHR.responseJSON['message']);
        },
    });
}

// TODO 注册逻辑
function doRegister() {

    $userProfile = {};

    $username = $("#username");
    $password = $("#password");

    if (isLogicEmpty($username.val()) || isLogicEmpty($password.val())) {
        alert("username and password can not be empty.");
        return;
    }

    $userProfile['username'] = encode($username.val().trim());
    $userProfile['password'] = encode($password.val().trim());

    $.ajax({
            url: dataindustryUrl + "/user_profile",
            type: "POST",
            async: true,
            contentType: "application/json",
            data: JSON.stringify($userProfile),
            success: function (data, textStatus, jqXHR) {
                alert(data.message)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseJSON['message'])
            }
        }
    );
}

// TODO 生成程序单
function makeProgramMenu() {

    let ajax_call_url = "";

    if ($userProfile.user_type === 0)
        ajax_call_url = dataindustryUrl + "/programs/" + $userProfile._id.$oid;
    else if ($userProfile.user_type === 1)
        ajax_call_url = dataindustryUrl + "/program_templates/" + $userProfile._id.$oid;
    else
        return;

    $.ajax({
        url: ajax_call_url,
        type: "GET",
        headers: {"Accept": "application/json"},
        dataType: 'json',
        error: handleRunError,
        success: function (data) {

            $programs = new Map;

            $.each($.parseJSON(data), function (index, value) {
                $programs.set(encodeProgramKey(value.program_no, value.language_id), value);
            });

            // 如果程序下拉列表尚未作出选择，那么在载入programs项后保持selectedProgramKey为空值。
            // 如果程序下拉列表曾经作出过选择，在重载programs后重新设定当前值。
            if (!isLogicEmpty($selectedProgramKey)) {
                let key = encodeProgramKey($program.program_no, $program.language_id);
                $program = $programs.get(key);
                $selectedProgramKeyInput[0].value = key;
                $selectedProgramKey = key;
            }

            makeProgramMenuItem();

        }
    });
}

// TODO 生成程序单子项
function makeProgramMenuItem() {

    $programMenu = $('#program-menu');
    $programMenu.html("");

    $programs.forEach(function (program) {

        let item = "";

        let key = encodeProgramKey(program.program_no, program.language_id);

        if ($userProfile.user_type === 0) {

            item =
                $(
                    '<div class="item" data-value="' + key + '">\n' +
                    '  <a class="ui ' + (program.is_submitted ? 'red' : 'grey') + ' icon label">\n' +
                    '    <i class="heart ' + (program.is_submitted ? 'grey outline' : 'red') + ' icon"></i>\n' +
                    '    ' + (program.is_submitted ? '已提交' : '未提交') + '\n' +
                    '  </a>\n' +
                    '  <a class="ui ' + (program.is_judged ? 'red' : 'grey') + ' icon label">\n' +
                    '    <i class="heart ' + (program.is_judged ? 'grey outline' : 'red') + ' icon"></i>\n' +
                    '    ' + (program.is_judged ? program.score : '未评分') + '\n' +
                    '  </a>\n' +
                    '  <label>' + program.program_name + '</label>\n' +
                    '</div>'
                );

        } else if ($userProfile.user_type === 1) {

            item =
                $(
                    '<div class="item" data-value="' + key + '">\n' +
                    '  <label>' + program.program_name + '</label>\n' +
                    '</div>'
                );

        }

        $programMenu.append(item);

    });

    $selectedProgramKeyInput = $('#selected-program-key-input');

    // 当鼠标悬停的时候储存当前的修改到$program
    $programMenu.focus(function () {
        $selectedProgramKey = $selectedProgramKeyInput.val();
        console.log($selectedProgramKey);
        if (!isLogicEmpty($selectedProgramKey)) {
            packageUIToData();
            $programs.set($selectedProgramKey, $program);
        }

    });

    // 发生选项变化的时候，从$programs里面读取数据
    $selectedProgramKeyInput.trigger('change');
    $selectedProgramKeyInput.change(function (e) {
        $selectedProgramKey = $selectedProgramKeyInput.val();
        if (!isLogicEmpty($selectedProgramKey)) {
            $program = $programs.get($selectedProgramKey);
            $prevLanguageId = $program.language_id;
            applyDataToUI(true);
        }
    });

    // 调整下拉列表的显示部分
    if ($userProfile.user_type === 0 && !isLogicEmpty($selectedProgramKey)) {
        $programHeader = $("#program-header");
        $programHeader.html("");
        let program = $programs.get($selectedProgramKey);

        let header = $(
            '<a class="ui ' + (program.is_submitted ? 'red' : 'grey') + ' icon label">\n' +
            '  <i class="heart ' + (program.is_submitted ? 'grey outline' : 'red') + ' icon"></i>\n' +
            '  ' + (program.is_submitted ? '已提交' : '未提交') + '\n' +
            '</a>\n' +
            '<a class="ui ' + (program.is_judged ? 'red' : 'grey') + ' icon label">\n' +
            '  <i class="heart ' + (program.is_judged ? 'grey outline' : 'red') + ' icon"></i>\n' +
            '  ' + (program.is_judged ? program.score : '未评分') + '\n' +
            '</a>\n' +
            '<label>' + program.program_name + '</label>\n'
        );

        $programHeader.append(header);

    }

}

// TODO 提交与发布的按钮逻辑
function submitOrPublish() {

    if ($userProfile === undefined || $userProfile === null) {
        showError("Error", "Please login first.");
        return;
    }

    if (sourceEditor.getValue().trim() === "") {
        showError("Error", "Source code can't be empty!");
        return;
    }

    $submitBtn.addClass("loading");
    $publishBtn.addClass("loading");

    packageUIToData();

    let ajax_call_url = "";

    if ($userProfile.user_type === 0) {

        ajax_call_url = dataindustryUrl + "/program";

        $program.is_submitted = true;
        $program.is_judged = false;
        $program.score = 0;

    } else if ($userProfile.user_type === 1) {

        //

        ajax_call_url = dataindustryUrl + "/program_template";
    }

    $program.user_profile_oid = $userProfile._id.$oid;
    $programs.set($selectedProgramKey, $program);

    $.ajax({
        url: ajax_call_url,
        type: "POST",
        async: true,
        contentType: "application/json",
        data: JSON.stringify($program),
        success: function (data, textStatus, jqXHR) {
            let i = 4;
            const time = setInterval(function () {
                if (i === 0) {
                    $submitBtn.removeClass("loading");
                    $publishBtn.removeClass("loading");
                    let menuStatusHtml = data.message + " " + new Date().Format("yyyy-MM-dd HH:mm:ss");
                    $("#menu-status").html(menuStatusHtml);
                    clearInterval(time);

                    // 只有学生模式下需要重建程序下拉列表
                    if ($userProfile.user_type === 0) {
                        makeProgramMenu();
                    }else if ($userProfile.user_type === 1){
                        // 需要更新description
                    }

                }
                i--;
            }, 1000);
        },
        error: handleRunError
    });
}
// END

function encode(str) {
    return btoa(unescape(encodeURIComponent(str || "")));
}

function decode(bytes) {
    let escaped = escape(atob(bytes || ""));
    try {
        return decodeURIComponent(escaped);
    } catch {
        return unescape(escaped);
    }
}

function localStorageSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (ignorable) {
    }
}

function localStorageGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (ignorable) {
        return null;
    }
}

function showApiUrl() {
    $("#api-url").attr("href", apiUrl);
}

function showError(title, content) {
    $("#site-modal #title").html(title);
    $("#site-modal .content").html(content);
    $("#site-modal").modal("show");
}

function handleError(jqXHR, textStatus, errorThrown) {
    showError(`${jqXHR.statusText} (${jqXHR.status})`, `<pre>${JSON.stringify(jqXHR, null, 4)}</pre>`);
}

function handleRunError(jqXHR, textStatus, errorThrown) {
    handleError(jqXHR, textStatus, errorThrown);
    $runBtn.removeClass("loading");
}

function handleResult(data) {
    timeEnd = performance.now();
    console.log("It took " + (timeEnd - timeStart) + " ms to get submission result.");

    var status = data.status;
    var stdout = decode(data.stdout);
    var stderr = decode(data.stderr);
    var compile_output = decode(data.compile_output);
    var sandbox_message = decode(data.message);
    var time = (data.time === null ? "-" : data.time + "s");
    var memory = (data.memory === null ? "-" : data.memory + "KB");

    $statusLine.html(`${status.description}, ${time}, ${memory}`);

    if (blinkStatusLine) {
        $statusLine.addClass("blink");
        setTimeout(function () {
            blinkStatusLine = false;
            localStorageSetItem("blink", "false");
            $statusLine.removeClass("blink");
        }, 3000);
    }

    stdoutEditor.setValue(stdout);
    stderrEditor.setValue(stderr);
    compileOutputEditor.setValue(compile_output);
    sandboxMessageEditor.setValue(sandbox_message);

    if (stdout !== "") {
        let dot = document.getElementById("stdout-dot");
        if (!dot.parentElement.classList.contains("lm_active")) {
            dot.hidden = false;
        }
    }
    if (stderr !== "") {
        let dot = document.getElementById("stderr-dot");
        if (!dot.parentElement.classList.contains("lm_active")) {
            dot.hidden = false;
        }
    }
    if (compile_output !== "") {
        let dot = document.getElementById("compile-output-dot");
        if (!dot.parentElement.classList.contains("lm_active")) {
            dot.hidden = false;
        }
    }
    if (sandbox_message !== "") {
        let dot = document.getElementById("sandbox-message-dot");
        if (!dot.parentElement.classList.contains("lm_active")) {
            dot.hidden = false;
        }
    }

    $runBtn.removeClass("loading");
}

function getIdFromURI() {
    return location.search.substr(1).trim();
}

function save() {
    let content = JSON.stringify({
        source_code: encode(sourceEditor.getValue()),
        language_id: $selectLanguage.val(),
        compiler_options: $compilerOptions.val(),
        command_line_arguments: $commandLineArguments.val(),
        stdin: encode(stdinEditor.getValue()),
        stdout: encode(stdoutEditor.getValue()),
        stderr: encode(stderrEditor.getValue()),
        compile_output: encode(compileOutputEditor.getValue()),
        sandbox_message: encode(sandboxMessageEditor.getValue()),
        status_line: encode($statusLine.html())
    });
    let filename = "judge0-ide.json";
    let data = {
        content: content,
        filename: filename
    };

    $.ajax({
        url: pbUrl,
        type: "POST",
        async: true,
        headers: {
            "Accept": "application/json"
        },
        data: data,
        success: function (data, textStatus, jqXHR) {
            if (getIdFromURI() !== data["short"]) {
                window.history.replaceState(null, null, location.origin + location.pathname + "?" + data["short"]);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            handleError(jqXHR, textStatus, errorThrown);
        }
    });
}

function downloadSource() {
    let value = parseInt($selectLanguage.val());
    download(sourceEditor.getValue(), fileNames[value], "text/plain");
}

function loadSavedSource() {
    let snippet_id = getIdFromURI();

    if (snippet_id.length === 36) {
        $.ajax({
            url: apiUrl + "/submissions/" + snippet_id + "?fields=source_code,language_id,stdin,stdout,stderr,compile_output,message,time,memory,status,compiler_options,command_line_arguments&base64_encoded=true",
            type: "GET",
            success: function (data, textStatus, jqXHR) {
                sourceEditor.setValue(decode(data["source_code"]));
                $selectLanguage.dropdown("set selected", data["language_id"]);
                $compilerOptions.val(data["compiler_options"]);
                $commandLineArguments.val(data["command_line_arguments"]);
                stdinEditor.setValue(decode(data["stdin"]));
                stdoutEditor.setValue(decode(data["stdout"]));
                stderrEditor.setValue(decode(data["stderr"]));
                compileOutputEditor.setValue(decode(data["compile_output"]));
                sandboxMessageEditor.setValue(decode(data["message"]));
                let time = (data.time === null ? "-" : data.time + "s");
                let memory = (data.memory === null ? "-" : data.memory + "KB");
                $statusLine.html(`${data.status.description}, ${time}, ${memory}`);
                changeEditorLanguage();
            },
            error: handleRunError
        });
    } else if (snippet_id.length === 4) {
        $.ajax({
            url: pbUrl + "/" + snippet_id + ".json",
            type: "GET",
            success: function (data, textStatus, jqXHR) {
                sourceEditor.setValue(decode(data["source_code"]));
                $selectLanguage.dropdown("set selected", data["language_id"]);
                $compilerOptions.val(data["compiler_options"]);
                $commandLineArguments.val(data["command_line_arguments"]);
                stdinEditor.setValue(decode(data["stdin"]));
                stdoutEditor.setValue(decode(data["stdout"]));
                stderrEditor.setValue(decode(data["stderr"]));
                compileOutputEditor.setValue(decode(data["compile_output"]));
                sandboxMessageEditor.setValue(decode(data["sandbox_message"]));
                $statusLine.html(decode(data["status_line"]));
                changeEditorLanguage();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showError("Not Found", "Code not found!");
                window.history.replaceState(null, null, location.origin + location.pathname);
                loadRandomLanguage();
            }
        });
    }
}

function run() {

    if (sourceEditor.getValue().trim() === "") {
        showError("Error", "Source code can't be empty!");
        return;
    } else {
        $runBtn.addClass("loading");
    }

    document.getElementById("stdout-dot").hidden = true;
    document.getElementById("stderr-dot").hidden = true;
    document.getElementById("compile-output-dot").hidden = true;
    document.getElementById("sandbox-message-dot").hidden = true;

    stdoutEditor.setValue("");
    stderrEditor.setValue("");
    compileOutputEditor.setValue("");
    sandboxMessageEditor.setValue("");

    // TODO 封装界面数据
    packageUIToData();
    // END

    timeStart = performance.now();
    $.ajax({
        url: apiUrl + `/submissions?base64_encoded=true&wait=${wait}`,
        type: "POST",
        async: true,
        contentType: "application/json",
        data: JSON.stringify($program),
        success: function (data, textStatus, jqXHR) {
            console.log(`Your submission token is: ${data.token}`);
            if (wait === true) {
                handleResult(data);
            } else {
                setTimeout(fetchSubmission.bind(null, data.token), check_timeout);
            }
        },
        error: handleRunError
    });
}

function fetchSubmission(submission_token) {
    $.ajax({
        url: apiUrl + "/submissions/" + submission_token + "?base64_encoded=true",
        type: "GET",
        async: true,
        success: function (data, textStatus, jqXHR) {
            if (data.status.id <= 2) { // In Queue or Processing
                setTimeout(fetchSubmission.bind(null, submission_token), check_timeout);
                return;
            }
            handleResult(data);
        },
        error: handleRunError
    });
}

function changeEditorLanguage() {
    // 设置monaco editor的语言模式
    monaco.editor.setModelLanguage(
        sourceEditor.getModel(), $selectLanguage.find(":selected").attr("mode"));
    currentLanguageId = parseInt($selectLanguage.val());

    // 设置文件名
    $(".lm_title")[0].innerText = fileNames[currentLanguageId];
    apiUrl = resolveApiUrl($selectLanguage.val());
    showApiUrl();
}

function insertTemplate() {
    currentLanguageId = parseInt($selectLanguage.val());
    sourceEditor.setValue(sources[currentLanguageId]);
    changeEditorLanguage();
}

function loadRandomLanguage() {
    let values = [];
    for (let i = 0; i < $selectLanguage[0].options.length; ++i) {
        values.push($selectLanguage[0].options[i].value);
    }
    $selectLanguage.dropdown("set selected", values[Math.floor(Math.random() * $selectLanguage[0].length)]);
    apiUrl = resolveApiUrl($selectLanguage.val());
    showApiUrl();
    insertTemplate();
}

function resizeEditor(layoutInfo) {
    if (editorMode !== "normal") {
        var statusLineHeight = $("#editor-status-line").height();
        layoutInfo.height -= statusLineHeight;
        layoutInfo.contentHeight -= statusLineHeight;
    }
}

// function disposeEditorModeObject() {
//     try {
//         editorModeObject.dispose();
//         editorModeObject = null;
//     } catch (ignorable) {
//     }
// }

// function changeEditorMode() {
//     disposeEditorModeObject();
//
//     if (editorMode === "vim") {
//         editorModeObject = MonacoVim.initVimMode(sourceEditor, $("#editor-status-line")[0]);
//     } else if (editorMode === "emacs") {
//         let statusNode = $("#editor-status-line")[0];
//         editorModeObject = new MonacoEmacs.EmacsExtension(sourceEditor);
//         editorModeObject.onDidMarkChange(function (e) {
//             statusNode.textContent = e ? "Mark Set!" : "Mark Unset";
//         });
//         editorModeObject.onDidChangeKey(function (str) {
//             statusNode.textContent = str;
//         });
//         editorModeObject.start();
//     }
// }

function resolveLanguageId(id) {
    id = parseInt(id);
    return languageIdTable[id] || id;
}

function resolveApiUrl(id) {
    id = parseInt(id);
    return languageApiUrlTable[id] || defaultUrl;
}

function editorsUpdateFontSize(fontSize) {
    sourceEditor.updateOptions({fontSize: fontSize});
    stdinEditor.updateOptions({fontSize: fontSize});
    stdoutEditor.updateOptions({fontSize: fontSize});
    stderrEditor.updateOptions({fontSize: fontSize});
    compileOutputEditor.updateOptions({fontSize: fontSize});
    sandboxMessageEditor.updateOptions({fontSize: fontSize});
}

$(window).resize(function () {
    layout.updateSize();
});

$(document).ready(function () {

    $compilerOptions = $("#compiler-options");
    $commandLineArguments = $("#command-line-arguments");
    $commandLineArguments.attr("size", $commandLineArguments.attr("placeholder").length);

    $insertTemplateBtn = $("#insert-template-btn");
    $insertTemplateBtn.click(function (e) {
        if (isEditorDirty && confirm("Are you sure? Your current changes will be lost.")) {
            insertTemplate();
        }
    });

    $runBtn = $("#run-btn");
    $runBtn.click(function (e) {
        run();
    });

    // START
    // TODO 提交按钮事件
    $submitBtn = $("#submit-btn");
    $submitBtn.click(function (e) {
        submitOrPublish();
    });
    $('#submit-btn-panel').hide();

    // TODO 发布按钮事件
    $publishBtn = $("#publish-btn");
    $publishBtn.click(function (e) {
        submitOrPublish();
    });
    $('#publish-btn-panel').hide();

    // TODO 登陆按钮事件（弹出框）
    $loginBtn = $("#login-btn");
    $loginBtn.click(function (e) {
        doLogin();
    });

    // TODO 注册按钮事件（弹出框）
    $registerBtn = $("#register-btn");
    $registerBtn.click(function (e) {
        doRegister();
    });

    // TODO 登陆按钮事件（菜单）
    $menuLoginBtn = $("#menu-login-btn");
    $menuLoginBtn.click(function (e) {
        showLoginModal();
    });

    // TODO 取消按钮事件（弹出框）
    $cancelBtn = $("#cancel-btn");
    $cancelBtn.click(function (e) {
        hideLoginModal();
    });

    // TODO 语言切换事件
    $selectLanguage = $("#select-language");
    $selectLanguage.change(function (e) {

        if ($userProfile !== undefined && $userProfile !== null) {

            $selectedProgramKey = $selectedProgramKeyInput.val();
            if (!isLogicEmpty($selectedProgramKey)) {

                let prevKey = encodeProgramKey($program.program_no, $prevLanguageId);
                let currentkey = encodeProgramKey($program.program_no, $selectLanguage.val());

                // 保存旧的数据
                packageUIToData();
                $programs.set(prevKey, $program);

                // 载入新的数据
                if ($programs.has(currentkey) === false) {
                    // 如果数据不存在，手动生成数据
                    $programs.set(currentkey, createNewProgram());
                }

                $program = $programs.get(currentkey);
                applyDataToUI(false);
                $prevLanguageId = $selectLanguage.val();
            }
        } else {
            insertTemplate();
            changeEditorLanguage();
        }

    });

    $("#program-menu-panel").hide();
    $("#username-label-panel").hide();
    showLoginModal();
    // END

    $navigationMessage = $("#navigation-message span");
    $about = $("#about");

    $(`input[name="editor-mode"][value="${editorMode}"]`).prop("checked", true);
    $("input[name=\"editor-mode\"]").on("change", function (e) {
        $('#site-settings').modal('hide');

        editorMode = e.target.value;
        localStorageSetItem("editorMode", editorMode);

        resizeEditor(sourceEditor.getLayoutInfo());
        // changeEditorMode();

        sourceEditor.focus();
    });

    $statusLine = $("#status-line");

    // $("body").keydown(function (e) {
    //     var keyCode = e.keyCode || e.which;
    //     if (keyCode == 120) { // F9
    //         e.preventDefault();
    //         run();
    //     } else if (keyCode == 119) { // F8
    //         e.preventDefault();
    //         var url = prompt("Enter URL of Judge0 API:", apiUrl);
    //         if (url != null) {
    //             url = url.trim();
    //         }
    //         if (url != null && url != "") {
    //             apiUrl = url;
    //             localStorageSetItem("api-url", apiUrl);
    //             showApiUrl();
    //         }
    //     } else if (keyCode == 118) { // F7
    //         e.preventDefault();
    //         wait = !wait;
    //         localStorageSetItem("wait", wait);
    //         alert(`Submission wait is ${wait ? "ON. Enjoy" : "OFF"}.`);
    //     } else if (event.ctrlKey && keyCode == 83) { // Ctrl+S
    //         e.preventDefault();
    //         save();
    //     } else if (event.ctrlKey && keyCode == 107) { // Ctrl++
    //         e.preventDefault();
    //         fontSize += 1;
    //         editorsUpdateFontSize(fontSize);
    //     } else if (event.ctrlKey && keyCode == 109) { // Ctrl+-
    //         e.preventDefault();
    //         fontSize -= 1;
    //         editorsUpdateFontSize(fontSize);
    //     }
    // });

    $("select.dropdown").dropdown();
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({action: "hide", on: "hover"});
    $(".ui.checkbox").checkbox();
    $(".message .close").on("click", function () {
        $(this).closest(".message").transition("fade");
    });

    showApiUrl();

    // require(["vs/editor/editor.main", "monaco-vim", "monaco-emacs"], function (ignorable, MVim, MEmacs) {
    require.config({ paths: { 'vs': 'js/monaco-editor/min/vs' }});
    require(["vs/editor/editor.main"], function () {
        layout = new GoldenLayout(layoutConfig, $("#site-content"));

        // MonacoVim = MVim;
        // MonacoEmacs = MEmacs;

        layout.registerComponent("source", function (container, state) {
            sourceEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: true,
                readOnly: state.readOnly,
                language: "cpp",
                minimap: {
                    enabled: false
                },
                rulers: [80, 120]
            });

            // changeEditorMode();

            sourceEditor.getModel().onDidChangeContent(function (e) {
                currentLanguageId = parseInt($selectLanguage.val());
                isEditorDirty = sourceEditor.getValue() !== sources[currentLanguageId];
            });

            sourceEditor.onDidLayoutChange(resizeEditor);
        });

        // TODO 注册description与descriptionMarkdown的组件
        layout.registerComponent("descriptionMarkdown", function (container, state) {
            descriptionMarkdownEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "markdown",
                minimap: {
                    enabled: false
                }
            });
        });

        layout.registerComponent("descriptionHtml", function (container, state) {
            descriptionHtmlPreviewer = container.getElement();
            descriptionHtmlPreviewer.html("");
        });
        // END


        layout.registerComponent("stdin", function (container, state) {
            stdinEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "plaintext",
                minimap: {
                    enabled: false
                }
            });
        });

        layout.registerComponent("stdout", function (container, state) {
            stdoutEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "plaintext",
                minimap: {
                    enabled: false
                }
            });

            container.on("tab", function (tab) {
                tab.element.append("<span id=\"stdout-dot\" class=\"dot\" hidden></span>");
                tab.element.on("mousedown", function (e) {
                    e.target.closest(".lm_tab").children[3].hidden = true;
                });
            });
        });

        layout.registerComponent("stderr", function (container, state) {
            stderrEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "plaintext",
                minimap: {
                    enabled: false
                }
            });

            container.on("tab", function (tab) {
                tab.element.append("<span id=\"stderr-dot\" class=\"dot\" hidden></span>");
                tab.element.on("mousedown", function (e) {
                    e.target.closest(".lm_tab").children[3].hidden = true;
                });
            });
        });

        layout.registerComponent("compile output", function (container, state) {
            compileOutputEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "plaintext",
                minimap: {
                    enabled: false
                }
            });

            container.on("tab", function (tab) {
                tab.element.append("<span id=\"compile-output-dot\" class=\"dot\" hidden></span>");
                tab.element.on("mousedown", function (e) {
                    e.target.closest(".lm_tab").children[3].hidden = true;
                });
            });
        });

        layout.registerComponent("sandbox message", function (container, state) {
            sandboxMessageEditor = monaco.editor.create(container.getElement()[0], {
                automaticLayout: true,
                theme: "vs-dark",
                scrollBeyondLastLine: false,
                readOnly: state.readOnly,
                language: "plaintext",
                minimap: {
                    enabled: false
                }
            });

            container.on("tab", function (tab) {
                tab.element.append("<span id=\"sandbox-message-dot\" class=\"dot\" hidden></span>");
                tab.element.on("mousedown", function (e) {
                    e.target.closest(".lm_tab").children[3].hidden = true;
                });
            });
        });

        layout.on("initialised", function () {
            $(".monaco-editor")[0].appendChild($("#editor-status-line")[0]);
            if (getIdFromURI()) {
                loadSavedSource();
            } else {
                loadRandomLanguage();
            }
            $("#site-navigation").css("border-bottom", "1px solid black");
            sourceEditor.focus();
        });

        layout.on('itemCreated', function (item) {
            if (item.config.cssClass)
                item.element.addClass(item.config.cssClass);
        });

        layout.init();

    });

});

// Template Sources
var assemblySource = "\
section	.text\n\
    global _start\n\
\n\
_start:\n\
\n\
    xor	eax, eax\n\
    lea	edx, [rax+len]\n\
    mov	al, 1\n\
    mov	esi, msg\n\
    mov	edi, eax\n\
    syscall\n\
\n\
    xor	edi, edi\n\
    lea	eax, [rdi+60]\n\
    syscall\n\
\n\
section	.rodata\n\
\n\
msg	db 'hello, world', 0xa\n\
len	equ	$ - msg\n\
";

var bashSource = "echo \"hello, world\"";

var basicSource = "PRINT \"hello, world\"";

var cSource = "\
#include <stdio.h>\n\
\n\
int main(void) {\n\
    printf(\"hello, world\\n\");\n\
    return 0;\n\
}\n\
";

var csharpSource = "\
public class Hello {\n\
    public static void Main() {\n\
        System.Console.WriteLine(\"hello, world\");\n\
    }\n\
}\n\
";

var cppSource = "\
#include <iostream>\n\
\n\
int main() {\n\
    std::cout << \"hello, world\" << std::endl;\n\
    return 0;\n\
}\n\
";

var lispSource = "(write-line \"hello, world\")";

var dSource = "\
import std.stdio;\n\
\n\
void main()\n\
{\n\
    writeln(\"hello, world\");\n\
}\n\
";

var elixirSource = "IO.puts \"hello, world\"";

var erlangSource = "\
main(_) ->\n\
    io:fwrite(\"hello, world\\n\").\n\
";

var executableSource = "\
Judge0 IDE assumes that content of executable is Base64 encoded.\n\
\n\
This means that you should Base64 encode content of your binary,\n\
paste it here and click \"Run\".\n\
\n\
Here is an example of compiled \"hello, world\" NASM program.\n\
Content of compiled binary is Base64 encoded and used as source code.\n\
\n\
https://ide.judge0.com/?kS_f\n\
";

var fortranSource = "\
program main\n\
    print *, \"hello, world\"\n\
end\n\
";

var goSource = "\
package main\n\
\n\
import \"fmt\"\n\
\n\
func main() {\n\
    fmt.Println(\"hello, world\")\n\
}\n\
";

var haskellSource = "main = putStrLn \"hello, world\"";

var javaSource = "\
public class Main {\n\
    public static void main(String[] args) {\n\
        System.out.println(\"hello, world\");\n\
    }\n\
}\n\
";

var javaScriptSource = "console.log(\"hello, world\");";

var luaSource = "print(\"hello, world\")";

var nimSource = "\
# On the Judge0 IDE, Nim is automatically\n\
# updated every day to the latest stable version.\n\
echo \"hello, world\"\n\
";

var ocamlSource = "print_endline \"hello, world\"";

var octaveSource = "printf(\"hello, world\\n\");";

var pascalSource = "\
program Hello;\n\
begin\n\
    writeln ('hello, world')\n\
end.\n\
";

var phpSource = "\
<?php\n\
print(\"hello, world\\n\");\n\
?>\n\
";

var plainTextSource = "hello, world\n";

var prologSource = "\
:- initialization(main).\n\
main :- write('hello, world\\n').\n\
";

var pythonSource = "print(\"hello, world\")";

var rubySource = "puts \"hello, world\"";

var rustSource = "\
fn main() {\n\
    println!(\"hello, world\");\n\
}\n\
"

var typescriptSource = "console.log(\"hello, world\");";

var vSource = "\
// On the Judge0 IDE, V is automatically\n\
// updated every hour to the latest version.\n\
fn main() {\n\
    println('hello, world')\n\
}\n\
";

var sources = {
    45: assemblySource,
    46: bashSource,
    47: basicSource,
    48: cSource,
    49: cSource,
    50: cSource,
    51: csharpSource,
    52: cppSource,
    53: cppSource,
    54: cppSource,
    55: lispSource,
    56: dSource,
    57: elixirSource,
    58: erlangSource,
    44: executableSource,
    59: fortranSource,
    60: goSource,
    61: haskellSource,
    62: javaSource,
    63: javaScriptSource,
    64: luaSource,
    1000: nimSource,
    65: ocamlSource,
    66: octaveSource,
    67: pascalSource,
    68: phpSource,
    43: plainTextSource,
    69: prologSource,
    70: pythonSource,
    71: pythonSource,
    72: rubySource,
    73: rustSource,
    74: typescriptSource,
    1001: vSource
};

var fileNames = {
    45: "main.asm",
    46: "script.sh",
    47: "main.bas",
    48: "main.c",
    49: "main.c",
    50: "main.c",
    51: "Main.cs",
    52: "main.cpp",
    53: "main.cpp",
    54: "main.cpp",
    55: "script.lisp",
    56: "main.d",
    57: "script.exs",
    58: "main.erl",
    44: "a.out",
    59: "main.f90",
    60: "main.go",
    61: "main.hs",
    62: "Main.java",
    63: "script.js",
    64: "script.lua",
    1000: "main.nim",
    65: "main.ml",
    66: "script.m",
    67: "main.pas",
    68: "script.php",
    43: "text.txt",
    69: "main.pro",
    70: "script.py",
    71: "script.py",
    72: "script.rb",
    73: "main.rs",
    74: "script.ts",
    1001: "main.v"
};

var languageIdTable = {
    1000: 1,
    1001: 1
}

var languageApiUrlTable = {
    1000: "https://nim.api.judge0.com",
    1001: "https://vlang.api.judge0.com"
}
