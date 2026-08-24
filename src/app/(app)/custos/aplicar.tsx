"use client";

/**
 * Envia o formulário assim que a escolha muda.
 *
 * Um `<select>` que exige clicar em "Aplicar" depois faz a pessoa trocar a
 * opção, olhar a tela intacta e concluir que o controle não funciona. Com
 * JavaScript, escolher já é aplicar.
 *
 * O `<noscript>` ao lado mantém o botão para quem não tem script: a tela
 * continua inteira, com um clique a mais, em vez de ter um controle morto.
 */
export function AplicarAoTrocar() {
  return (
    <script
      // Um efeito exigiria um componente por controle e uma referência ao
      // formulário; o listener delegado cobre qualquer <select> dentro de um
      // <form> marcado, inclusive os que ainda nem existem na primeira
      // renderização.
      dangerouslySetInnerHTML={{
        __html: `document.addEventListener("change",function(e){var s=e.target;if(s&&s.tagName==="SELECT"&&s.dataset.controle&&s.form)s.form.requestSubmit()},true)`,
      }}
    />
  );
}
