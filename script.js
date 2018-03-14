var actor_json, outbox_json;

function loadPage() {
    if (!actor_json["name"]) actor_json["name"] = actor_json["preferredUsername"];
    elemid("display_name").innerText = actor_json["name"];
    elemid("username").innerText = actor_json["preferredUsername"];
    elemid("note").innerHTML = actor_json["summary"];
    elemid("totalitems").innerText = outbox_json['totalItems'];

    var i = 0, date = null, datecount = {}, datelist = [], dc_post = [], dc_bt = [];
    outbox_json["orderedItems"] = outbox_json["orderedItems"].reverse();
    while (outbox_json["orderedItems"][i]) {
        date = new Date(outbox_json["orderedItems"][i]['published']);
        date = date.getFullYear() + "/" + (date.getMonth() + 1);

        if (!datecount[date]) datecount[date] = {"post": 0, "bt": 0};
        if (outbox_json["orderedItems"][i]["type"] === "Create") {
            datecount[date]["post"]++;
        } else if (outbox_json["orderedItems"][i]["type"] === "Announce") {
            datecount[date]["bt"]++;
        }
        if (datecount.length > 20) {
            datecount.length = 20;
            break;
        }
        i++;
    }
    var key;
    for (key in datecount) {
        dc_post.unshift(datecount[key]["post"]);
        dc_bt.unshift(datecount[key]["bt"]);
        datelist.unshift(key);
    }
    var ctx = document.getElementById("Chart");
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datelist,
            datasets: [{
                label: "投稿",
                borderColor: "#607d8b",
                data: dc_post
            }, {
                label: "ブースト",
                borderColor: "#2196F3",
                data: dc_bt
            }]

        },
        options: {
            title: {
                display: true,
                text: '月別トゥート数統計'
            },
            scales: {
                yAxes: [{stacked: true}]
            },
            tooltips:{mode:'label'}
        }
    });

    elemid("load").className = "invisible";
    elemid("main").className = "";
    loading(0);
}

function loadAllToot() {
    var i = 0, toothtml = "";
    while (outbox_json["orderedItems"][i]) {
        toothtml += toot(outbox_json["orderedItems"][i]);
        i++;
        if (!outbox_json["orderedItems"][i]) loading(0);
    }
    elemid("tootlist").innerHTML = toothtml;
}

function loadfile() {
    loading(1);
    actor_json = null;
    outbox_json = null;
    var actor_json_file = elemid("actor-json").files[0];
    var outbox_json_file = elemid("outbox-json").files[0];
    if (actor_json_file && outbox_json_file) {
        try {
            var file_reader = new FileReader();
            file_reader.onload = function (event) {
                var json = JSON.parse(event.target.result);
                if (json["type"] === "Person") {
                    actor_json = json;
                    file_reader.readAsText(outbox_json_file);
                } else if (json["type"] === "OrderedCollection") {
                    outbox_json = json;
                    if (!actor_json) {
                        error("ファイルを逆に選択しているようです。やり直してください。");
                    }
                } else {
                    error("これはMastodonのエクスポートファイルではないようです。");
                }
                if (actor_json && outbox_json) {
                    loadPage();
                }
            };
            file_reader.readAsText(actor_json_file);
        } catch (e) {
            error("ファイルの読み込み中にエラーが発生しました。"+e);
        }
    } else {
        error("ファイルが選択されていません。");
    }
}

function toot(toot) {
    var html, content, url;

    if (toot["type"] === "Announce") { //BT
        url = toot['object'];
        content = "<span class='blue-text'>[ブーストした投稿]</span> <small>日時をクリックするとブーストしたトゥートを見ることができます</small>";
    } else if (toot["type"] === "Create") {
        url = toot['object']['url'];
        content = toot['object']['content'];
    }

    html = "<div class='card-panel toot'>" +
        "<b>"+actor_json["name"]+"</b> <span class='blue-grey-text'>@"+actor_json["preferredUsername"]+"</span>" +
        "<div class='right'><a href='"+url+"' target='_blank' class='blue-grey-text'>"+toot['published']+"</a></div>" +
        "<p>"+content+"</p>\n" +
        "</div>";

    return html;
}

function error(text) {
    elemid("error-text").innerText = text;
    elemid("error-box").style.display = "block";
}

function elemid(id) {
    return document.getElementById(id);
}

function loading(mode) {
    var progress = elemid("progress");
    if (mode) {
        progress.className = "progress";
    } else {
        progress.className = "progress invisible";
    }
}