# API Verification Evidence

### Paginated Response

```bash
$ curl -i -s -g "http://localhost:3000/api/v1/restaurants?limit=2&offset=0"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 60
Content-Type: application/json; charset=utf-8
Content-Length: 593
ETag: W/"251-tBTh/NSGOWBJyMs/gh7p6cu/VBM"
Date: Fri, 09 Oct 2026 23:21:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":[{"id":"00c63eee-9845-451d-ab8f-876459d26e1a","name":"Boyer Group Restaurant","description":"Calamitas demum acquiro defluo terga.","address":"5281 Dwayne Flats","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"010b2f16-0370-40ca-bc8b-28f13b51c855","name":"Berge and Sons Restaurant","description":"Repellat nisi curis deleniti teneo abundans torrens undique qui spargo.","address":"2940 Quigley Fort","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"}],"meta":{"totalCount":200,"limit":2,"offset":0,"hasNextPage":true}}
```

### Maximum Limit Clamping

```bash
$ curl -i -s -g "http://localhost:3000/api/v1/restaurants?limit=5000"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 98
RateLimit-Reset: 57
Content-Type: application/json; charset=utf-8
Content-Length: 26192
ETag: W/"6650-uq1ZZT9xzmWPbVKqKx3g+aPqaHU"
Date: Fri, 09 Oct 2026 23:21:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":[{"id":"00c63eee-9845-451d-ab8f-876459d26e1a","name":"Boyer Group Restaurant","description":"Calamitas demum acquiro defluo terga.","address":"5281 Dwayne Flats","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"010b2f16-0370-40ca-bc8b-28f13b51c855","name":"Berge and Sons Restaurant","description":"Repellat nisi curis deleniti teneo abundans torrens undique qui spargo.","address":"2940 Quigley Fort","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"021618af-fbcd-423b-83c1-45adb8466e91","name":"Wintheiser, Ortiz and Hammes Restaurant","description":"Tubineus amor ver trado cunae condico calamitas adipiscor concido.","address":"95858 Beryl Trace","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0230218c-94cf-4e7c-8317-5c7d8ea25f45","name":"Hudson - D'Amore Restaurant","description":"Basium agnitio absconditus timor suffoco thymbra defaeco.","address":"4819 The Laurels","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"02c04175-f3f9-42c1-ba3c-08bc4db78026","name":"Moen Group Restaurant","description":"Caveo socius textus crastinus animi tabgo.","address":"5001 Church Walk","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"079f525c-ed03-4c1b-8078-91c89e89a621","name":"Veum, D'Amore and Prosacco Restaurant","description":"Baiulus denique copiose.","address":"4203 Ellsworth Shores","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"089f2554-3cce-434a-8000-7c62ee0b80e7","name":"Krajcik - Breitenberg Restaurant","description":"Trans deporto demo fuga.","address":"762 Schiller Divide","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0b7a130b-d9be-43ab-b79f-0da9ecc8e03a","name":"Borer-Mitchell Inc Restaurant","description":"Delego ventito deinde cubitum beneficium clementia.","address":"35756 Veum Passage","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0c0d7741-e4b1-4e71-81e9-a9ad57052757","name":"Skiles, Homenick and Hermann Restaurant","description":"Adflicto ambulo allatus valde pauci pecto.","address":"5297 Zelda Walks","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0c424b02-f43e-4854-b0d2-7b8243b68777","name":"Haag Group Restaurant","description":"Usus adhaero aro.","address":"65314 Prohaska Parks","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0c61bf7b-aabb-4cec-874c-a66938d53ae0","name":"Kertzmann Group Restaurant","description":"Tardus commemoro conventus clementia aspicio totus sopor tenetur corona ascisco.","address":"1415 Boehm Throughway","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0c8c48b4-8071-407d-9ad5-3c95d095ee7b","name":"O'Keefe LLC Restaurant","description":"Accusamus audio est quisquam.","address":"44292 Ivory Plains","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0d9b0087-e1a9-44a7-8ef1-f378831107b9","name":"Prosacco, Rau and Weber Restaurant","description":"Statim subito theologus cruciamentum defessus degusto vulgaris soluta terra.","address":"1588 Tressa Shore","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0dcf05f6-c288-4cd8-9ff9-f0cd8dd1047d","name":"Feil - Rodriguez Restaurant","description":"Fuga statim tracto corrigo depulso acidus vulgaris termes.","address":"309 Lawrence Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0e1d96a6-efd3-4722-94c4-dc2b6a5ed99c","name":"Mohr - Roberts Restaurant","description":"Abduco sollers usitas surgo provident urbs officia nobis.","address":"94816 Rogelio Radial","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"0fd5a0ea-b0a3-47d6-8889-597c8d251ca7","name":"Kub and Sons Restaurant","description":"Trepide decor vulariter impedit.","address":"768 Remington Light","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"104452f3-9c4a-4b55-a3a3-a585136be8eb","name":"Wiegand and Sons Restaurant","description":"Aqua testimonium coerceo voluntarius inventore vinculum.","address":"235 Florencio Knoll","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"11219de5-4c5a-4857-85fd-f8dbbdcf25f0","name":"Hilpert - Donnelly Restaurant","description":"Caveo crepusculum creator crapula charisma arcus.","address":"53784 Spencer Lock","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"11487d1a-e5a0-468a-9b5f-182beae6cca3","name":"Botsford LLC Restaurant","description":"Quasi voluptatem cognomen supellex absorbeo claustrum.","address":"5998 Donnelly Trafficway","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"125c9118-afb0-4167-b1af-3efac193de48","name":"Pouros - Hilll Restaurant","description":"Decor thymbra verumtamen exercitationem voveo.","address":"9095 Frami Village","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"12d0bc41-c5e1-4a23-9707-149ee7b3f7a7","name":"Watsica, Heller and Wilkinson Restaurant","description":"Spoliatio usitas sollers aperio corona thesis texo.","address":"3773 Kattie Bridge","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"150555ad-f2a3-4e1c-905e-8c0658ac099d","name":"Douglas Group Restaurant","description":"Esse urbs voco esse tribuo strenuus vigor occaecati vestigium.","address":"9720 Evalyn Bridge","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"165ee5f8-044c-47d5-b6c1-12ba1af6b5ec","name":"O'Kon Inc Restaurant","description":"Libero officiis accommodo coniuratio administratio timidus versus vilitas somnus.","address":"330 Ernser Villages","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"18b72851-98e6-4021-a5b0-e049bfa91b7a","name":"Balistreri Inc Restaurant","description":"Defluo clamo correptius bos suffragium trado deficio.","address":"615 Mraz Manors","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"19753bc9-8792-4edb-b9b0-8f79f218ce48","name":"Tremblay - Lowe Restaurant","description":"Teneo vulnero sumptus adficio.","address":"44914 Astrid Extensions","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"1a7f6cb1-7307-4426-9351-6f74e50bea77","name":"Pollich, Block and Wehner Restaurant","description":"Censura combibo amita velociter ea uberrime amor crux vorago.","address":"607 Edward Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"1cab37f5-7726-439b-916b-270e0bee25c1","name":"Heidenreich - Robel Restaurant","description":"Velociter amitto quod accusantium vomica fugit tamisium.","address":"17522 Main Street S","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"1d915285-5829-4fe5-8792-607d31e30bc1","name":"Hirthe - Kiehn Restaurant","description":"Canto appono aliqua charisma suffoco tutamen decet adsum.","address":"4067 Johnathan Unions","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"1f0f1e26-6b82-4a68-b834-3064556cb36c","name":"Labadie - Kerluke Restaurant","description":"Vigilo totam ultra cicuta.","address":"2196 Lavon Gateway","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"1f55462b-6a95-4010-8cc5-cad103fb528b","name":"Maggio - Kuhic Restaurant","description":"Ater amet trepide verecundia corrigo agnosco acidus.","address":"5267 Spinka Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"20f08c60-c6de-4196-9272-5402e7596644","name":"Stamm - Gorczany Restaurant","description":"Truculenter modi calco demum repellat cubo cibus aer calamitas.","address":"9066 Kaylee Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"212d62a8-f1dd-4de3-ac26-5674d7dbd8ed","name":"Goyette, Ward and Lindgren Restaurant","description":"Vulgaris terminatio ipsam.","address":"6359 Princess Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"24153f26-0381-41c5-9bcb-7abec6a5e006","name":"Mitchell and Sons Restaurant","description":"Antiquus quasi conscendo convoco asper asporto.","address":"83244 Lorena Lakes","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2733b7f7-e7cf-4551-9050-ced7b51bb53c","name":"Braun, Kunze and Sawayn Restaurant","description":"Dedico ulciscor commemoro debitis.","address":"5767 Oak Avenue","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2884a2d5-1114-4ba5-a984-eb19f305ee28","name":"Yundt - Hessel Restaurant","description":"Et suus defessus.","address":"4405 N 2nd Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"29324209-a443-4850-8a76-f1e680269c7d","name":"Ankunding - Goyette-Rau Restaurant","description":"Acervus aranea ulterius molestias tibi terminatio abscido.","address":"74911 Paulette Groves","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2b887661-538a-4181-bbec-8b56de7b5f5b","name":"Walter - Crona Restaurant","description":"Acceptus dolores conqueror.","address":"9028 Franecki Burg","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2c85b124-6fba-47ce-b185-df7197c5f091","name":"Schmidt - Fahey Restaurant","description":"Decet abeo tonsor clibanus utilis sit.","address":"9887 Louvenia Corner","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2cd5b457-de13-48ec-8aca-fbd38626248b","name":"Blanda, Morar and Fisher-Rice Restaurant","description":"Aegrus appono curriculum patruus demo creptio.","address":"518 Labadie Keys","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2da61697-b76f-499a-8bee-1beb816f79e1","name":"Wiegand LLC Restaurant","description":"Maxime texo spectaculum atqui beneficium animi.","address":"732 Armstrong Crest","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2edcef5e-e320-4bac-beb2-ef47742408fc","name":"Howe - Marquardt Restaurant","description":"Absorbeo animadverto sunt cras admiratio usus.","address":"8999 North Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"2f7c28d9-9cc4-4073-8b42-ea955440074c","name":"Douglas - Schaden Restaurant","description":"Amicitia ceno tres argumentum creber certe collum nesciunt tracto.","address":"23004 Gusikowski Terrace","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"327a9a86-7d93-4805-acac-0854aa9f6d89","name":"Hartmann and Sons Restaurant","description":"Villa corporis congregatio addo molestias accommodo usitas decimus iusto conqueror.","address":"38347 Crist Mount","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"33b6d3ce-31d0-4fe2-8e28-c062304a07cf","name":"Pacocha, Marquardt and Stehr Restaurant","description":"Exercitationem vindico aestus.","address":"601 Kreiger Groves","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"34385ed0-f457-4623-ac54-912f5408fda1","name":"Reichert-Towne, Nicolas and Berge Restaurant","description":"Vergo cibo vicissitudo video thymbra verus curia somniculosus pauci.","address":"83106 Leland Shore","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"37188063-ffa3-48dc-ba53-8c2441028480","name":"Bernhard, Gislason and Lockman Restaurant","description":"Ambitus numquam ater aperiam antepono delinquo.","address":"4808 Brenden Row","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"372759c5-fdf7-467a-9952-5d3aa8db292f","name":"Jaskolski - Aufderhar Restaurant","description":"Succedo tertius pel distinctio aedificium abundans coepi stips.","address":"2832 Cartwright Glens","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3790c498-7c18-482c-a1e3-7463a61b06ee","name":"Bechtelar, Bailey and Jakubowski Restaurant","description":"Nulla suffoco speculum comedo tunc audax vehemens tamen desino decumbo.","address":"3842 Toy Grove","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3858cc34-c164-4d3e-afcb-0abc0f237418","name":"Durgan, Corkery and Gusikowski Restaurant","description":"Veritatis ver volaticus stipes claudeo consequuntur adsuesco libero vorax.","address":"518 Buckridge Union","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3983f02a-ccad-4da9-b208-f179810529fe","name":"Turcotte LLC Restaurant","description":"Corrigo curo bibo dolore ad tempora.","address":"72443 Luciano Ways","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3a614a5b-76f3-4f66-ae9c-512c192b1f22","name":"Simonis, Schamberger and O'Hara Restaurant","description":"Demoror aqua sit copiose cattus verecundia creator sponte alienus urbanus.","address":"500 Northfield Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3bfa85f5-c5cb-4ba4-b4bb-23c37d2e0bad","name":"Ruecker Inc Restaurant","description":"Corrupti tamen cruentus dignissimos omnis.","address":"66123 Devyn Streets","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3c6e04c4-bc8d-4225-8a66-9a8f84e6d740","name":"Romaguera Group Restaurant","description":"Cras cuppedia villa curto suus attollo atrocitas.","address":"3666 Odie Flats","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3d78a3fe-01de-4330-800f-ec728f762eff","name":"Kshlerin - O'Kon Restaurant","description":"Voluptas taceo copiose aedificium acsi talus crebro denique ait creator.","address":"23775 Nikolaus Park","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3e5d7196-127a-445f-b62e-0b2865ac7656","name":"Harvey LLC Restaurant","description":"Aequitas aufero apto voluptatibus nobis.","address":"6609 Station Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3f33f5f6-a094-4544-8de9-ca2110ae9293","name":"Bartoletti - Kemmer Restaurant","description":"Trucido conturbo bene tenetur maiores deduco vaco corpus.","address":"6258 Rebekah Station","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"3fb3e234-d08c-4fcb-be68-b1b104e5b4d9","name":"Ondricka, Wilderman and Ortiz-Schaefer Restaurant","description":"Sollicito asper labore cur.","address":"5680 Trudie Burg","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"4401cef3-1fc3-4c4e-8c5d-c2a47702ac9f","name":"Ernser - Sauer Restaurant","description":"Paens asperiores quis.","address":"736 Gust Coves","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"49aa594c-d56c-4e15-b783-89a87768cd37","name":"Borer - Kozey Restaurant","description":"Varius auditor carbo dolor perferendis commemoro calculus.","address":"81288 The Dell","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"4aa8f139-3963-40cb-bdf9-c9586c09f144","name":"Schaden - Farrell Restaurant","description":"Vesica cubo chirographum.","address":"3976 S Lincoln Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"4ab9fca9-6b5b-4d4f-bef7-8c8c34b604f9","name":"Torphy, Murray and Heidenreich Restaurant","description":"Adfectus vulnus absque.","address":"7223 Milton Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"4cb98f7a-afbe-4757-84d7-bc65ec1e3c52","name":"Hermann, Bayer and Berge Restaurant","description":"Crux argumentum tres cedo exercitationem sub viduo.","address":"1612 Anthony Square","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"52d3c1fa-6ce8-4efd-9f7a-08073673cfb3","name":"Harvey - Connelly Restaurant","description":"Custodia solum aeneus eaque arguo valeo claro traho eligendi spero.","address":"363 The Copse","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"534e7e94-67fb-4f20-86e1-693b349fd438","name":"Friesen - Denesik Restaurant","description":"Circumvenio tersus vulnus.","address":"24144 Viola Lake","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"5362fff8-e5a3-4063-893c-cc3de48a79a0","name":"Runolfsdottir Group Restaurant","description":"Mollitia timidus caveo cupiditas.","address":"381 Willow Grove","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"53962086-5660-4210-a2b7-6c4a969160f3","name":"Fahey Group Restaurant","description":"Aqua consequuntur aro doloribus.","address":"27234 Kulas Bridge","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"53977872-ebca-4104-aca0-bbe0a9905a25","name":"Daugherty, Bosco and Kiehn Restaurant","description":"Labore curo coaegresco.","address":"275 Schuppe Parkway","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"562b72cc-5ed9-4a8c-88d5-1a4db62bea3e","name":"Jones - Stark Restaurant","description":"Officiis vestigium decerno umerus comprehendo amissio cariosus confido.","address":"414 Park Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"58451a8b-1885-4355-9740-f441c078dad4","name":"Wunsch, West and Corwin Restaurant","description":"Vorax cupiditate apud ater tactus laborum reprehenderit suppono minus.","address":"10648 High Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"595bd791-ef3d-4518-b3dc-4f07e2dfb86f","name":"Herman - Boyle Restaurant","description":"Crastinus vetus tepesco advenio ipsam decretum tenus turpis taedium.","address":"5020 White Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"5a036c58-1497-4e3d-89f3-dabedb0b39bd","name":"Johnson and Sons Restaurant","description":"Laboriosam bestia urbs solvo somniculosus.","address":"74739 Turner Estates","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"5a60dca2-ba28-40e4-8a53-5e0157d8e9bd","name":"Bernier - Daugherty Restaurant","description":"Aspicio eveniet apud creta.","address":"763 North Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"5c9bcc94-9d70-4e93-9e84-c0e4f23c867b","name":"Hammes, Will and Heller Restaurant","description":"Cupio sunt tamquam adfectus utilis agnitio decor.","address":"1532 Mayfield Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"5d900be2-7795-4d41-afdf-27f49a1f43e8","name":"Mueller LLC Restaurant","description":"Tamen addo thema thymum tolero arca.","address":"8686 Shana Track","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"6287e398-5c17-4a6e-b2b9-fbf3a13602e6","name":"Bartell, Ortiz and Kreiger Restaurant","description":"Ventito conqueror xiphias advoco sed surgo.","address":"2389 Kihn Shore","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"62a15f28-9ddd-4d2a-832b-7eebea9122c8","name":"Erdman-Hegmann - Schulist Restaurant","description":"Combibo solvo sequi conitor aufero damno desino enim defaeco.","address":"94715 Jordan Run","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"6314ab30-b64d-47af-9a60-75f34cfa09e3","name":"Kuvalis, Keebler-Lueilwitz and Trantow Restaurant","description":"Cui tempora virga comprehendo neque cupio decipio cometes contra adipisci.","address":"6023 Lia Oval","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"636ac293-fd40-46f4-85f5-e325d3c121b3","name":"Tremblay - Shields Restaurant","description":"Sto vulnero sto.","address":"941 Woodland Close","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"6484ec9c-83a5-47d7-880f-faabbab2016c","name":"Reynolds - Hodkiewicz Restaurant","description":"Custodia argentum atqui animi facere alius adaugeo vulticulus reprehenderit spiritus.","address":"29430 St Andrew's Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"64ceab0b-62ba-495a-aa45-e3080334d08c","name":"Ritchie-Sawayn Group Restaurant","description":"Suscipit cupio culpa sumo adicio vulnero quaerat pectus catena temptatio.","address":"8555 Hegmann Spurs","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"6a67b937-98ec-4441-a10a-780584e65512","name":"Hessel, Batz and Sporer Restaurant","description":"Commodi recusandae vetus umerus.","address":"70969 Barrows Lake","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"6ab6496c-b43e-49b8-865e-e257966c4e0b","name":"Kemmer, Cassin and Marquardt Restaurant","description":"Dolor debeo cauda adeo cubitum.","address":"144 Bogisich Manors","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"70c9be2e-c5d7-445b-9ac8-07d409b10c07","name":"DuBuque - Gottlieb Restaurant","description":"Aduro cotidie basium provident.","address":"8399 A Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"71355d90-fd14-43bc-9ba1-3be66faa5fc4","name":"Hessel, Brown and Torp Restaurant","description":"Vehemens comminor adfero molestias adsum.","address":"4264 Goyette Forges","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"727a0ab9-62cf-41d5-be04-31d91f027e1f","name":"Purdy Group Restaurant","description":"Abstergo volva vitium saepe deprecator sunt.","address":"67270 Steuber Terrace","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"753df272-c734-46a3-bd7e-55dd8b553163","name":"Ruecker - Champlin Restaurant","description":"Rem vespillo spectaculum aliqua tametsi adflicto supra thymum caecus suscipit.","address":"2116 Derby Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"75f80dd1-09fb-4d51-a555-846d9308dc7c","name":"Spinka - Lemke Restaurant","description":"Creptio patruus adficio.","address":"225 Donny Greens","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"76b48891-7b8f-4d65-bbd6-83bb6ac77d9c","name":"Klocko, Kling and Beier Restaurant","description":"Praesentium excepturi inventore amita fugit ustulo calco.","address":"15681 Justen Brooks","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"7794913d-9caf-47fa-92f1-1ac4271dd500","name":"Veum, Jones and Abernathy Restaurant","description":"Consectetur vehemens volaticus veritatis fugiat nostrum acervus.","address":"9492 Vivienne Lodge","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"77c5a60f-ed03-426c-8d81-c80fa1a90d94","name":"Bode, Nolan and Runolfsson Restaurant","description":"Perspiciatis apud bellicus casso.","address":"406 Priory Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"783f0b45-fcdc-4189-8f47-1b8d25c839d7","name":"Heidenreich LLC Restaurant","description":"Esse suppono alioqui solio sumo accusantium supra.","address":"767 Moore Forks","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"787f7803-a127-4a25-b6d7-1b89f8915b67","name":"Dickens LLC Restaurant","description":"Consuasor bellum occaecati colo tamdiu demo benigne.","address":"3862 Faye Courts","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"7cd3c167-361e-4e82-a5a8-1f8b95f89e07","name":"Lueilwitz Inc Restaurant","description":"Clarus barba spiculum varius collum cohibeo.","address":"58294 Williamson Mission","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"7f3cf1ce-1ac0-4580-af8f-d2ef2dc90758","name":"Keeling, Okuneva and Romaguera Restaurant","description":"Apostolus ventito terga bene defetiscor vergo verbera fugit ustulo molestiae.","address":"98211 St Andrew's Road","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"7f9ef521-ef6d-43e9-8160-a6dd980ab8c5","name":"Becker - Schumm Restaurant","description":"Agnosco tenetur viduo occaecati cursim tripudio calculus debitis subvenio neque.","address":"8702 Station Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"820a0e97-7ea0-40f9-a97a-d4afca87857c","name":"Corkery - Harris Restaurant","description":"Thesis architecto creptio alii.","address":"47848 Hodkiewicz Inlet","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"841f7546-c9b6-41f1-a76f-1df08040ce80","name":"Kihn LLC Restaurant","description":"Venio adimpleo adimpleo chirographum caelestis tamisium strenuus trado veritas.","address":"10512 Jayme Cliff","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"85cea46b-6c7f-479c-ab9e-3710640582a7","name":"Gleichner, Boehm and Yost Restaurant","description":"Tergiversatio defetiscor ullam confugo aestus depromo dignissimos vulgivagus amissio tui.","address":"634 Malcolm Burgs","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"8752feb3-835d-4954-b689-8c6af9d6334b","name":"Ritchie Group Restaurant","description":"Caries vester in civis amplus.","address":"404 Walsh-Wilkinson View","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"},{"id":"89962a0e-1295-4fa7-bc10-2a05c1683814","name":"Effertz LLC Restaurant","description":"Apto curto vesco acsi validus cupio adfero itaque.","address":"7946 New Street","createdAt":"2026-10-09T23:20:56.684Z","updatedAt":"2026-10-09T23:20:56.684Z"}],"meta":{"totalCount":200,"limit":100,"offset":0,"hasNextPage":true}}
```

### Invalid Offset Rejection

```bash
$ curl -i -s -g "http://localhost:3000/api/v1/restaurants?offset=-5"
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 97
RateLimit-Reset: 57
Content-Type: application/json; charset=utf-8
Content-Length: 77
ETag: W/"4d-wP22bpL2e5LgezNuQnVWel05g5s"
Date: Fri, 09 Oct 2026 23:21:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"INVALID_PAGINATION","message":"Offset cannot be negative"}}
```

### Invalid Sort Field

```bash
$ curl -i -s -g "http://localhost:3000/api/v1/restaurants?sort=unknown"
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 96
RateLimit-Reset: 57
Content-Type: application/json; charset=utf-8
Content-Length: 91
ETag: W/"5b-vsQ5sQ/Fd/9q9K2Tksz1wkX3Ivk"
Date: Fri, 09 Oct 2026 23:21:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"VALIDATION_ERROR","message":"\"sort\" must be one of [name, createdAt]"}}
```

### Order Creation

```bash
$ curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "http://localhost:3000/api/v1/orders"
HTTP/1.1 201 Created
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 92
RateLimit-Reset: 54
Content-Type: application/json; charset=utf-8
Content-Length: 592
ETag: W/"250-vhBYZeYwevARwUgHuDlA21MlnCA"
Date: Fri, 09 Oct 2026 23:21:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":"c23676f5-dd6b-4baf-81ad-be27aaa1e088","customerId":"00f90ff7-4489-4eed-a8e4-90216c4f026f","restaurantId":"00c63eee-9845-451d-ab8f-876459d26e1a","status":"pending","totalPriceCents":7128,"currency":"USD","createdAt":"2026-10-09T23:21:47.555Z","updatedAt":"2026-10-09T23:21:47.555Z","orderItems":[{"id":"5a8ec149-2cc0-4f4b-a89a-94495aea7ae3","orderId":"c23676f5-dd6b-4baf-81ad-be27aaa1e088","menuItemId":"d17f19e8-d8f3-400a-9d52-2a5f8ba757c8","quantity":2,"priceAtOrderCents":3564,"currency":"USD","createdAt":"2026-10-09T23:21:47.555Z","updatedAt":"2026-10-09T23:21:47.555Z"}]}}
```

### Order Partial Update (Status)

```bash
$ curl -i -s -X PATCH -H "Content-Type: application/json" -d "{\"status\":\"accepted\"}" "http://localhost:3000/api/v1/orders/c23676f5-dd6b-4baf-81ad-be27aaa1e088"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 91
RateLimit-Reset: 50
Content-Type: application/json; charset=utf-8
Content-Length: 593
ETag: W/"251-m4SsdG2xuSPc9pIyWb9KGvBxTpk"
Date: Fri, 09 Oct 2026 23:21:50 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"data":{"id":"c23676f5-dd6b-4baf-81ad-be27aaa1e088","customerId":"00f90ff7-4489-4eed-a8e4-90216c4f026f","restaurantId":"00c63eee-9845-451d-ab8f-876459d26e1a","status":"accepted","totalPriceCents":7128,"currency":"USD","createdAt":"2026-10-09T23:21:47.555Z","updatedAt":"2026-10-09T23:21:49.513Z","orderItems":[{"id":"5a8ec149-2cc0-4f4b-a89a-94495aea7ae3","orderId":"c23676f5-dd6b-4baf-81ad-be27aaa1e088","menuItemId":"d17f19e8-d8f3-400a-9d52-2a5f8ba757c8","quantity":2,"priceAtOrderCents":3564,"currency":"USD","createdAt":"2026-10-09T23:21:47.555Z","updatedAt":"2026-10-09T23:21:47.555Z"}]}}
```

### Order Deletion Rejection (Not Pending)

```bash
$ curl -i -s -X DELETE "http://localhost:3000/api/v1/orders/c23676f5-dd6b-4baf-81ad-be27aaa1e088"
HTTP/1.1 422 Unprocessable Entity
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
RateLimit-Policy: 100;w=60
RateLimit-Limit: 100
RateLimit-Remaining: 90
RateLimit-Reset: 48
Content-Type: application/json; charset=utf-8
Content-Length: 88
ETag: W/"58-H98mmARpmmiAGpM0tKGLYrXQVwQ"
Date: Fri, 09 Oct 2026 23:21:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"UNPROCESSABLE_ENTITY","message":"Only pending orders can be deleted"}}
```

### Rate Limit Rejection and Retry-After

```bash
$ curl -i "http://localhost:3000/api/v1/restaurants"

```

