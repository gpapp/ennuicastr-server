<?JS
/*
 * Copyright (c) 2022 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

function fail(msg) {
    writeHead(500, {"content-type": "application/json"});
    write(JSON.stringify({
        fail: msg || "Failed"
    }));
}

const uidX = await include("../../uid.jss", {verbose: true});
if (!uidX) return;
if (uidX.level < 2 /* admin */)
    return writeHead(302, {"location": "/panel/rec/"});
const uid = uidX.uid;

if (!request.body || !request.body.i)
    return fail();

const rid = +request.body.i;

const config = require("../config.js");
const db = require("../db.js").db;
const id36 = require("../id36.js");
const recM = require("../rec.js");

const rec = await recM.get(rid, uid);
if (!rec || rec.uid !== uid)
    return fail("Invalid");

// OK, this user is allowed to share this recording, so do so
let token;
while (true) {
    try {
        await db.runP("BEGIN TRANSACTION;");

        const rec2 = await db.getP(
            "SELECT * FROM recordings WHERE rid=@RID AND uid=@UID;", {
            "@RID": rid,
            "@UID": rec.uid
        });
        if (!rec2) {
            await db.runP("ROLLBACK;");
            return writeHead(302, {"location": "/panel/rec/"});
        }

        const exp = await db.getP(
            "SELECT datetime('now', '1 day') AS exp;");

        // Add a share token
        const extra = JSON.parse(rec2.extra || "{}");
        extra.shareTokens = extra.shareTokens || {};
        do {
            token = id36.genID(12);
        } while (extra.shareTokens[token]);
        extra.shareTokens[token] = exp.exp;

        // No more than 8 share tokens at a time
        while (Object.keys(extra.shareTokens).length > 8) {
            let earliestTime = "9999";
            let earliestToken = "";
            for (const otoken in extra.shareTokens) {
                const otime = extra.shareTokens[otoken];
                if (otime < earliestTime) {
                    earliestTime = otime;
                    earliestToken = otoken;
                }
            }
            delete extra.shareTokens[earliestToken];
        }

        // Commit
        await db.runP(
            "UPDATE recordings SET extra=@EXTRA WHERE rid=@RID AND uid=@UID;", {
            "@EXTRA": JSON.stringify(extra),
            "@RID": rid,
            "@UID": rec.uid
        });

        await db.runP("COMMIT;");
        break;
    } catch (ex) {
        await db.runP("ROLLBACK;");
    }
}

writeHead(200, {"content-type": "application/json"});
write(JSON.stringify({
    token,
    url: `${config.panel}rec/share/?i=${rid.toString(36)}&t=${token}`
}));
?>
