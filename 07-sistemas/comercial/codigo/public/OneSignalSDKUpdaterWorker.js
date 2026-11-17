// Worker de ATUALIZAÇÃO do OneSignal (02/11/2026).
//
// O SDK procura DOIS arquivos na raiz quando o painel está no modo "Typical Site":
//   /OneSignalSDKWorker.js         (o worker que recebe os push)
//   /OneSignalSDKUpdaterWorker.js  (o que troca o worker quando o SDK atualiza)
// O segundo estava 404 — o SDK registrava o primeiro, mas a cada atualização de SDK
// ficava sem caminho de troca, e o registro entrava em estado inconsistente:
// a inscrição continuava existindo no OneSignal, com token válido, mas sem worker
// ativo para exibir a notificação. É o mesmo sintoma de "Apple aceita, nada aparece".
//
// Este arquivo tem de existir enquanto o painel estiver em "Typical Site".
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js')
