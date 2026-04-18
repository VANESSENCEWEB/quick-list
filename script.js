
        /* ===========================================================
           ESTADO DA APLICAÇÃO
           -----------------------------------------------------------
           Cada item é um objeto com estas propriedades:
           {
             id: number         → identificador único (timestamp)
             nome: string       → nome do item (ex: "Arroz integral")
             qtd: number        → quantidade desejada
             categoria: string  → chave da categoria (ex: "frutas")
             concluido: boolean → se já foi comprado ou não
             criadoEm: string   → data/hora de criação (ISO 8601)
           }
           O array inteiro é salvo no localStorage para persistência.
        =========================================================== */
        let itens = JSON.parse(localStorage.getItem('quicklist-v2')) || [];

        /* ===========================================================
           PERSISTÊNCIA
           -----------------------------------------------------------
           Converte o array "itens" para JSON e salva no localStorage.
           O localStorage guarda dados no navegador de forma persistente
           (não apaga ao fechar a aba, só ao limpar dados do navegador).
        =========================================================== */
        function salvar() {
            localStorage.setItem('quicklist-v2', JSON.stringify(itens));
        }

        /* ===========================================================
           DATA E HORA
           -----------------------------------------------------------
           Usa a API Intl do JavaScript para formatar a data por extenso
           no padrão brasileiro. Exemplo:
           "Sábado, 18 de abril de 2026" e "14:35"
           Atualiza automaticamente a cada 30 segundos.
        =========================================================== */
        function atualizarDataHora() {
            const agora = new Date();

            // toLocaleDateString com opções retorna a data formatada
            const opcoesData = {
                weekday: 'long',    // ex: "sábado"
                day: 'numeric',     // ex: "18"
                month: 'long',      // ex: "abril"
                year: 'numeric'     // ex: "2026"
            };
            const dataFormatada = agora.toLocaleDateString('pt-BR', opcoesData);

            // Capitaliza a primeira letra (sábado → Sábado)
            document.getElementById('dataAtual').textContent =
                dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

            // Hora no formato HH:MM
            const hora = agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('horaAtual').textContent = hora;
        }

        atualizarDataHora();
        setInterval(atualizarDataHora, 30000);

        /* ===========================================================
           TOAST — notificação temporária na parte inferior da tela
           -----------------------------------------------------------
           Exibe uma mensagem por 2.2 segundos e desaparece.
           Usada para dar feedback visual nas ações do usuário.
        =========================================================== */
        let toastTimer = null;
        function toast(msg) {
            const el = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            el.classList.add('visivel');

            // Limpa timer anterior (evita conflito se clicar rápido)
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => el.classList.remove('visivel'), 2200);
        }

        /* ===========================================================
           SEGURANÇA — previne XSS
           -----------------------------------------------------------
           Ao exibir texto digitado pelo usuário no HTML, precisamos
           "escapar" caracteres especiais como < > & " para evitar
           que alguém injete código malicioso na página.
        =========================================================== */
        function esc(t) {
            const d = document.createElement('div');
            d.textContent = t;    // textContent é seguro (não interpreta HTML)
            return d.innerHTML;   // innerHTML retorna o texto já escapado
        }

        /* ===========================================================
           MAPA DE CATEGORIAS
           -----------------------------------------------------------
           Objeto que mapeia o valor do <select> para o nome legível
           e a classe CSS que define a cor da tag.
        =========================================================== */
        const CATEGORIAS = {
            frutas:  { label: 'Frutas',  classe: 'tag-frutas' },
            carnes:  { label: 'Carnes',  classe: 'tag-carnes' },
            padaria: { label: 'Padaria', classe: 'tag-padaria' },
            bebidas: { label: 'Bebidas', classe: 'tag-bebidas' },
            limpeza: { label: 'Limpeza', classe: 'tag-limpeza' },
            outros:  { label: 'Outros',  classe: 'tag-outros' }
        };

        /* ===========================================================
           ADICIONAR ITEM
           -----------------------------------------------------------
           1. Lê os valores dos campos (nome, quantidade, categoria)
           2. Valida se o nome não está vazio
           3. Cria um objeto com ID único (Date.now())
           4. Adiciona no INÍCIO do array (unshift)
           5. Salva, renderiza e mostra feedback
        =========================================================== */
        function adicionarItem() {
            const inputNome = document.getElementById('inputNome');
            const inputQtd = document.getElementById('inputQtd');
            const selectCat = document.getElementById('selectCat');

            const nome = inputNome.value.trim();
            if (!nome) { inputNome.focus(); return; }

            // Math.max(1, ...) garante que a quantidade mínima é 1
            const qtd = Math.max(1, parseInt(inputQtd.value) || 1);

            itens.unshift({
                id: Date.now(),
                nome,
                qtd,
                categoria: selectCat.value,
                concluido: false,
                criadoEm: new Date().toISOString()
            });

            salvar();
            renderizar();

            // Limpa os campos e foca no input de nome
            inputNome.value = '';
            inputQtd.value = '1';
            inputNome.focus();
            toast(`✅ "${nome}" adicionado!`);
        }

        /* ===========================================================
           ALTERNAR CONCLUSÃO (marcar/desmarcar como comprado)
           -----------------------------------------------------------
           Encontra o item pelo ID e inverte o valor de "concluido".
           Isso move o item entre as seções Pendentes e Concluídos.
        =========================================================== */
        function toggleConcluido(id) {
            const item = itens.find(i => i.id === id);
            if (item) {
                item.concluido = !item.concluido;
                salvar();
                renderizar();
            }
        }

        /* ===========================================================
           EXCLUIR ITEM
           -----------------------------------------------------------
           1. Adiciona a classe CSS "removendo" (aciona a animação)
           2. Após 400ms (duração da animação), remove do array
           3. Salva, renderiza e mostra toast de confirmação
        =========================================================== */
        function excluir(id) {
            const el = document.getElementById(`item-${id}`);
            const item = itens.find(i => i.id === id);

            if (el) el.classList.add('removendo');

            setTimeout(() => {
                itens = itens.filter(i => i.id !== id);
                salvar();
                renderizar();
                if (item) toast(`🗑️ "${item.nome}" removido`);
            }, 400);
        }

        /* ===========================================================
           LIMPAR TODOS OS CONCLUÍDOS
           -----------------------------------------------------------
           Remove de uma vez todos os itens com concluido === true.
        =========================================================== */
        function limparConcluidos() {
            const qtd = itens.filter(i => i.concluido).length;
            itens = itens.filter(i => !i.concluido);
            salvar();
            renderizar();
            toast(`🧹 ${qtd} ite${qtd > 1 ? 'ns' : 'm'} removido${qtd > 1 ? 's' : ''}`);
        }

        /* ===========================================================
           RENDERIZAR — função principal de atualização da interface
           -----------------------------------------------------------
           Esta função é chamada SEMPRE que os dados mudam.
           Ela faz:
           1. Filtra itens pela busca (se houver texto no campo)
           2. Separa em dois arrays: pendentes e concluidos
           3. Atualiza a barra de progresso
           4. Renderiza a seção de PENDENTES
           5. Renderiza a seção de CONCLUÍDOS (separada!)
        =========================================================== */
        function renderizar() {
            const busca = document.getElementById('inputBusca').value.toLowerCase().trim();

            // Se há busca ativa, filtra pelo nome
            const filtrados = busca
                ? itens.filter(i => i.nome.toLowerCase().includes(busca))
                : itens;

            // Separa em pendentes e concluídos
            const pendentes = filtrados.filter(i => !i.concluido);
            const concluidos = filtrados.filter(i => i.concluido);

            // ---- Barra de progresso (usa todos os itens, sem filtro de busca) ----
            const totalGeral = itens.length;
            const concluidosGeral = itens.filter(i => i.concluido).length;
            const pct = totalGeral > 0 ? Math.round((concluidosGeral / totalGeral) * 100) : 0;

            document.getElementById('progressoWrapper').style.display =
                totalGeral > 0 ? 'block' : 'none';
            document.getElementById('progressoLabel').textContent =
                `${concluidosGeral} de ${totalGeral} ite${totalGeral > 1 ? 'ns' : 'm'} comprado${concluidosGeral !== 1 ? 's' : ''}`;
            document.getElementById('progressoPorcentagem').textContent = `${pct}%`;
            document.getElementById('progressoFill').style.width = `${pct}%`;

            // ---- SEÇÃO PENDENTES ----
            const secPend = document.getElementById('secaoPendentes');
            if (pendentes.length > 0) {
                secPend.innerHTML = `
                    <div class="secao-header">
                        <div class="secao-titulo">
                            <h3>Pendentes</h3>
                            <span class="secao-badge">${pendentes.length}</span>
                        </div>
                    </div>
                    <div class="items-list">
                        ${pendentes.map((item, i) => criarCardHTML(item, i)).join('')}
                    </div>
                `;
            } else if (totalGeral > 0 && concluidos.length > 0) {
                secPend.innerHTML = `
                    <div class="vazio">
                        <div class="vazio-icon">🎉</div>
                        <p>Todos os itens foram comprados!</p>
                    </div>
                `;
            } else if (totalGeral === 0) {
                secPend.innerHTML = `
                    <div class="vazio">
                        <div class="vazio-icon">🧺</div>
                        <p>Sua lista está vazia.<br>Adicione itens acima para começar!</p>
                    </div>
                `;
            } else {
                secPend.innerHTML = '';
            }

            // ---- SEÇÃO CONCLUÍDOS ----
            const secConc = document.getElementById('secaoConcluidos');
            if (concluidos.length > 0) {
                secConc.innerHTML = `
                    <div class="secao-header">
                        <div class="secao-titulo">
                            <h3>Concluídos</h3>
                            <span class="secao-badge concluidos">${concluidos.length}</span>
                        </div>
                        <button class="btn-limpar" onclick="limparConcluidos()">Limpar tudo</button>
                    </div>
                    <div class="items-list">
                        ${concluidos.map((item, i) => criarCardHTML(item, i)).join('')}
                    </div>
                `;
            } else {
                secConc.innerHTML = '';
            }
        }

        /* ===========================================================
           CRIAR HTML DO CARD DE UM ITEM
           -----------------------------------------------------------
           Retorna uma string HTML representando um item da lista.
           É usada tanto para itens pendentes quanto concluídos.
           
           Parâmetros:
           - item: o objeto do item { id, nome, qtd, categoria, ... }
           - index: posição na lista (usada para delay da animação)
        =========================================================== */
        function criarCardHTML(item, index) {
            const cat = CATEGORIAS[item.categoria] || CATEGORIAS.outros;

            return `
                <div class="item ${item.concluido ? 'concluido' : ''}"
                     id="item-${item.id}"
                     style="animation-delay: ${index * 0.04}s">

                    <!-- Checkbox customizado -->
                    <label class="ck-wrapper">
                        <input type="checkbox"
                               ${item.concluido ? 'checked' : ''}
                               onchange="toggleConcluido(${item.id})">
                        <span class="ck-visual"></span>
                    </label>

                    <!-- Nome do item -->
                    <span class="item-nome">${esc(item.nome)}</span>

                    <!-- Tag de categoria (desktop) -->
                    <span class="item-tag ${cat.classe}">${cat.label}</span>

                    <!-- Quantidade -->
                    <span class="item-qtd">×${item.qtd}</span>

                    <!-- Botão excluir (ícone SVG de lixeira) -->
                    <button class="btn-del" onclick="excluir(${item.id})" title="Remover">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                        </svg>
                    </button>

                    <!-- Tag + Qtd em mobile (aparece embaixo do nome) -->
                    <div class="item-meta-mobile">
                        <span class="item-tag ${cat.classe}">${cat.label}</span>
                        <span class="item-qtd">×${item.qtd}</span>
                    </div>
                </div>
            `;
        }

        /* ===========================================================
           EVENTO: Enter no campo de nome adiciona o item
        =========================================================== */
        document.getElementById('inputNome').addEventListener('keypress', e => {
            if (e.key === 'Enter') adicionarItem();
        });

        /* ===========================================================
           INICIALIZAÇÃO — renderiza a lista ao carregar a página
        =========================================================== */
        renderizar();
