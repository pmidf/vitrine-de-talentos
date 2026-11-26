# SCRUM-135 · Acessibilidade da galeria

Auditoria realizada em 26/11/2026 na rota `/voluntarios`, com o build de produção executado localmente. O Chrome 158.0.8127.38 recebeu três perfis fictícios de uma API local, incluindo um com foto, perfis sem foto e um cargo com uma palavra longa. A mesma rota foi testada com uma resposta vazia.

| Item | Como testei | Resultado | Evidência |
| --- | --- | --- | --- |
| Galeria única | Contei as listas e os cartões no DOM nas três larguras | Uma lista com três cartões em cada largura | [Medições](resultado.json) |
| Celular a 360 px | Emulei 360 × 800 e comparei a largura da janela com a do documento | 360/360 px, uma coluna e sem rolagem horizontal, inclusive com o menu aberto | [Captura](galeria-360.png) |
| Tablet a 768 px | Emulei 768 × 1024 e inspecionei a grade | 768/768 px, duas colunas e sem rolagem horizontal | [Captura](galeria-768.png) |
| Computador a 1440 px | Emulei 1440 × 900 e inspecionei a grade | 1440/1440 px, quatro colunas e sem rolagem horizontal | [Captura](galeria-1440.png) |
| Navegação por teclado | Usei Tab e Enter para pular ao conteúdo, percorrer os links da galeria e abrir e percorrer o menu móvel | Os controles testados receberam foco em ordem. O atalho levou o foco ao conteúdo | [Sequência](resultado.json) |
| Foco visível | Inspecionei o estilo dos elementos que receberam foco por teclado | Contorno roxo escuro sólido de 3 px com afastamento de 3 px | [Captura do foco](foco-360.png) |
| Contraste | Executei a auditoria de contraste do Lighthouse | Aprovado nos textos avaliados | [Resultado do contraste](resultado.json) |
| Alternativa textual | Conferi o atributo `alt` da foto e os nomes expostos na árvore de acessibilidade do Chrome | A foto foi exposta como “Foto de Ana Exemplo”. O avatar recebeu “Foto não disponível para Bruno Exemplo” | [Medições](resultado.json) e [captura](galeria-360.png) |
| Lista vazia | Recarreguei a galeria com zero perfis | A página apresentou “Nenhum voluntário encontrado.” e zero cartões | [Captura](galeria-vazia.png) |
| Lighthouse | Executei a categoria de acessibilidade na configuração móvel do Lighthouse 13.6.0 | **100/100**, sem falhas nas auditorias automáticas aplicáveis | [Resultado do Lighthouse](resultado.json) |

A árvore de acessibilidade foi inspecionada no Chrome. O teste não incluiu uma sessão com leitor de tela.
