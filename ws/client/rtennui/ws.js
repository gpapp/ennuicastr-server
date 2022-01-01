/*
 * Copyright (c) 2021 Yahweasel
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

const rte = await import(
    __dirname + "/../../../node_modules/rtennui-server/src/main.js");

if (!module.rtes) {
    module.ondisconnect = () => process.exit(0);
    module.rtes = new rte.RTEnnuiServer(acceptLogin);
}
const rtes = module.rtes;

rtes.acceptConnection(sock);

/**
 * Accept logins from the client. There is no verification here, so all logins
 * are accepted.
 * @param credentials  Login credentials
 */
function acceptLogin(credentials) {
    return Promise.resolve({
        room: credentials.id ? credentials.id.toString(36) : "RTEnnui",
        info: {uid: credentials.uid || 0}
    });
}
