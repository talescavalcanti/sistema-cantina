import { useEffect, useState } from 'react'
import cardapio from './cardapio.json'
import './App.css'

// VERSÃO GO-HORSE: tudo neste arquivo, de propósito.
// Os comentários "DÍVIDA" marcam o que a v2 (PoC final) vai refatorar.

type Pedido = {
  senha: string
  cliente: string
  itens: { id: string; nome: string; preco: number; qtd: number }[]
  total: number
  pagamento: string
  retirada: string
  status: string
  criadoEm: number
}

export default function App() {
  const [rota, setRota] = useState(window.location.hash)
  const [pedidos, setPedidos] = useState<Pedido[]>(JSON.parse(localStorage.getItem('pedidos') || '[]'))
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [tela, setTela] = useState('cardapio')
  const [categoria, setCategoria] = useState(cardapio.categorias[0].nome)
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState(localStorage.getItem('nomeCliente') || '')
  const [retirada, setRetirada] = useState('Assim que ficar pronto')
  const [metodo, setMetodo] = useState('pix')
  const [numeroCartao, setNumeroCartao] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const [minhaSenha, setMinhaSenha] = useState(localStorage.getItem('minhaSenha') || '')
  const [slide, setSlide] = useState(0)
  const [semFoto, setSemFoto] = useState<Record<string, boolean>>({})

  // DÍVIDA (Ocultamento de informação / DIP): a tela fala direto com o localStorage.
  useEffect(() => {
    const aoMudarHash = () => setRota(window.location.hash)
    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === 'pedidos') setPedidos(JSON.parse(e.newValue || '[]'))
    }
    window.addEventListener('hashchange', aoMudarHash)
    window.addEventListener('storage', aoMudarStorage)
    return () => {
      window.removeEventListener('hashchange', aoMudarHash)
      window.removeEventListener('storage', aoMudarStorage)
    }
  }, [])

  const meuPedido = pedidos.find((p) => p.senha === minhaSenha)

  useEffect(() => {
    if (meuPedido && meuPedido.status === 'pronto') {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      document.title = '🔔 Pedido pronto! ' + meuPedido.senha
    } else {
      document.title = 'Imperial Padaria'
    }
  }, [meuPedido?.status])

  function salvarPedidos(lista: Pedido[]) {
    localStorage.setItem('pedidos', JSON.stringify(lista))
    setPedidos(lista)
  }

  function fmt(v: number) {
    return 'R$ ' + v.toFixed(2).replace('.', ',')
  }

  // DÍVIDA (Aberto/Fechado): nova categoria = editar este if/else.
  function emoji(cat: string) {
    if (cat === 'Salgados') return '🥟'
    else if (cat === 'Sanduíches naturais') return '🥪'
    else if (cat === 'Tapiocas') return '🌮'
    else if (cat === 'Croissant') return '🥐'
    else if (cat === 'Cuscuz recheado') return '🍚'
    else if (cat === 'Hot dog') return '🌭'
    else if (cat === 'Sobremesas') return '🍰'
    else if (cat === 'Bebidas') return '🥤'
    else return '🍽️'
  }

  const todosItens = cardapio.categorias.flatMap((c) => c.itens.map((i) => ({ ...i, categoria: c.nome })))

  // DÍVIDA (Integridade conceitual): destaques e descrições soltos aqui, fora do cardapio.json.
  const destaques = [
    { id: 'coxinha-frango-requeijao', rotulo: 'Salgado' },
    { id: 'tapioca-carne-sol-queijo', rotulo: 'Tapioca' },
    { id: 'croissant-frango-requeijao', rotulo: 'Croissant' },
    { id: 'cuscuz-carne-sol-queijo', rotulo: 'Cuscuz' },
  ]
  const maisPedidos = [
    { id: 'coxinha-frango', descricao: 'Massa sequinha e recheio cremoso de frango desfiado.' },
    { id: 'tapioca-queijo', descricao: 'Feita na hora, crocante por fora e com queijo derretendo.' },
    { id: 'bolo-rolo', descricao: 'Camadas finas de goiabada, receita pernambucana de verdade.' },
  ]
  const itemDestaque = todosItens.find((i) => i.id === destaques[slide].id)!

  // Foto do produto ou, se o arquivo ainda não existir em public/assets, um placeholder com o nome esperado.
  function foto(src: string, alt: string, classe: string, dica: string) {
    if (semFoto[src]) {
      return (
        <div className={'placeholder ' + classe} role="img" aria-label={alt}>
          <span>{src.replace('/assets/', '')}</span>
          <small>{dica}</small>
        </div>
      )
    }
    return <img className={'foto ' + classe} src={src} alt={alt} onError={() => setSemFoto((s) => ({ ...s, [src]: true }))} />
  }

  function irParaCardapio(cat?: string) {
    if (rota === '#/balcao') window.location.hash = '#/'
    setTela('cardapio')
    setBusca('')
    if (cat) setCategoria(cat)
    setTimeout(() => document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // DÍVIDA (Demeter / SRP): total calculado na tela, percorrendo estrutura alheia.
  let totalCarrinho = 0
  let qtdCarrinho = 0
  for (const id in carrinho) {
    const item = todosItens.find((i) => i.id === id)
    if (item) {
      totalCarrinho += item.preco * carrinho[id]
      qtdCarrinho += carrinho[id]
    }
  }

  function adicionar(id: string) {
    setCarrinho({ ...carrinho, [id]: (carrinho[id] || 0) + 1 })
  }

  function remover(id: string) {
    const novo = { ...carrinho }
    if (novo[id] > 1) novo[id] = novo[id] - 1
    else delete novo[id]
    setCarrinho(novo)
  }

  const naFila = pedidos.filter((p) => p.status === 'recebido' || p.status === 'preparo')

  const horarios = ['Assim que ficar pronto']
  const agora = new Date()
  const base = new Date(agora)
  base.setMinutes(Math.ceil((agora.getMinutes() + 10) / 15) * 15, 0, 0)
  for (let i = 0; i < 6; i++) {
    const h = new Date(base.getTime() + i * 15 * 60000)
    horarios.push(String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0'))
  }

  // DÍVIDA (Aberto/Fechado + SRP + complexidade ciclomática): validação,
  // pagamento, senha e persistência no mesmo método. Novo meio de pagamento = mais um else if.
  function finalizarPedido() {
    setErro('')
    if (!nome.trim()) {
      setErro('Coloca teu nome pra gente te chamar no balcão.')
      return
    }
    if (qtdCarrinho === 0) {
      setErro('Seu carrinho está vazio.')
      return
    }
    let descricaoPagamento = ''
    if (metodo === 'pix') {
      descricaoPagamento = 'Pix'
    } else if (metodo === 'cartao') {
      const numero = numeroCartao.replace(/\D/g, '')
      if (numero.length !== 16) {
        setErro('O número do cartão precisa ter 16 dígitos.')
        return
      } else if (!/^\d{2}\/\d{2}$/.test(validade)) {
        setErro('Validade no formato MM/AA.')
        return
      } else if (cvv.length !== 3) {
        setErro('CVV precisa ter 3 dígitos.')
        return
      }
      descricaoPagamento = 'Cartão final ' + numero.slice(-4)
    } else {
      setErro('Meio de pagamento desconhecido.')
      return
    }

    setProcessando(true)
    setTimeout(() => {
      const contador = Number(localStorage.getItem('contadorSenha') || '0') + 1
      localStorage.setItem('contadorSenha', String(contador))
      const senha = 'A-' + String(contador).padStart(3, '0')
      const itens = []
      for (const id in carrinho) {
        const item = todosItens.find((i) => i.id === id)
        if (item) itens.push({ id: item.id, nome: item.nome, preco: item.preco, qtd: carrinho[id] })
      }
      const novo: Pedido = {
        senha,
        cliente: nome.trim(),
        itens,
        total: totalCarrinho,
        pagamento: descricaoPagamento,
        retirada,
        status: 'recebido',
        criadoEm: Date.now(),
      }
      const atuais: Pedido[] = JSON.parse(localStorage.getItem('pedidos') || '[]')
      salvarPedidos([...atuais, novo])
      localStorage.setItem('minhaSenha', senha)
      localStorage.setItem('nomeCliente', nome.trim())
      setMinhaSenha(senha)
      setCarrinho({})
      setNumeroCartao('')
      setValidade('')
      setCvv('')
      setProcessando(false)
      setTela('senha')
    }, 1200)
  }

  // DÍVIDA (Ocultamento de informação): qualquer um muda o status para qualquer valor.
  function avancarStatus(senha: string) {
    const atuais: Pedido[] = JSON.parse(localStorage.getItem('pedidos') || '[]')
    const lista = atuais.map((p) => {
      if (p.senha !== senha) return p
      if (p.status === 'recebido') return { ...p, status: 'preparo' }
      else if (p.status === 'preparo') return { ...p, status: 'pronto' }
      else if (p.status === 'pronto') return { ...p, status: 'retirado' }
      else return p
    })
    salvarPedidos(lista)
  }

  function zerarDia() {
    if (!confirm('Apagar todos os pedidos e reiniciar as senhas?')) return
    localStorage.removeItem('contadorSenha')
    salvarPedidos([])
  }

  const cabecalho = (
    <header className="topo">
      <a href="#/" className="marca">
        <img src="/logo.png" alt="Imperial Padaria" />
      </a>
      <nav className="menu">
        {['Salgados', 'Tapiocas', 'Croissant', 'Sobremesas', 'Bebidas'].map((c) => (
          <button key={c} onClick={() => irParaCardapio(c)}>
            {c}
          </button>
        ))}
      </nav>
      <div className="acoes">
        <button className="botao-contorno" onClick={() => irParaCardapio()}>
          Ver cardápio
        </button>
        <button
          className="botao-contorno icone"
          aria-label={'Carrinho com ' + qtdCarrinho + ' itens'}
          onClick={() => {
            if (rota === '#/balcao') window.location.hash = '#/'
            setTela('carrinho')
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
            <path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.1L21 8H6" />
          </svg>
          {qtdCarrinho > 0 && <span className="badge">{qtdCarrinho}</span>}
        </button>
      </div>
    </header>
  )

  // ===================== TELA DO BALCÃO =====================
  if (rota === '#/balcao') {
    const colunas = [
      { status: 'recebido', titulo: 'Recebidos', acao: 'Iniciar preparo' },
      { status: 'preparo', titulo: 'Em preparo', acao: 'Marcar pronto' },
      { status: 'pronto', titulo: 'Prontos', acao: 'Entregue' },
    ]
    const retirados = pedidos.filter((p) => p.status === 'retirado')
    let faturamento = 0
    for (const p of pedidos) faturamento += p.total
    return (
      <div className="pagina larga">
        {cabecalho}
        <section className="painel balcao-resumo">
          <div>
            <h1 className="display">Balcão</h1>
            <p className="suave">
              {naFila.length} na fila · {retirados.length} entregues · {fmt(faturamento)} hoje
            </p>
          </div>
          <button className="botao contorno" onClick={zerarDia}>
            Zerar dia
          </button>
        </section>
        <div className="kanban">
          {colunas.map((col) => {
            const lista = pedidos.filter((p) => p.status === col.status)
            return (
              <section key={col.status} className={'coluna coluna-' + col.status}>
                <h2>
                  {col.titulo} <span className="contador">{lista.length}</span>
                </h2>
                {lista.length === 0 && <p className="vazio">Nada por aqui.</p>}
                {lista.map((p) => (
                  <article key={p.senha} className="ticket">
                    <div className="ticket-topo">
                      <strong className="senha-pequena">{p.senha}</strong>
                      <span>{p.cliente}</span>
                    </div>
                    <ul>
                      {p.itens.map((i) => (
                        <li key={i.id}>
                          {i.qtd}× {i.nome}
                        </li>
                      ))}
                    </ul>
                    <p className="suave pequeno">
                      {p.retirada} · {p.pagamento} · {fmt(p.total)}
                    </p>
                    <button className="botao primario cheio" onClick={() => avancarStatus(p.senha)}>
                      {col.acao}
                    </button>
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    )
  }

  // ===================== TELA DA SENHA =====================
  if (tela === 'senha' && meuPedido) {
    const etapas = ['recebido', 'preparo', 'pronto', 'retirado']
    const nomesEtapas = ['Recebido', 'Em preparo', 'Pronto', 'Retirado']
    const indice = etapas.indexOf(meuPedido.status)
    let naFrente = 0
    for (const p of naFila) if (p.criadoEm < meuPedido.criadoEm) naFrente++
    return (
      <div className="pagina">
        {cabecalho}
        {meuPedido.status === 'pronto' && <div className="alerta-pronto">🔔 Seu pedido está pronto! Corre no balcão.</div>}
        <section className="painel centro estreito">
          <p className="suave">Sua senha</p>
          <div className="senha-grande">{meuPedido.senha}</div>
          <p>
            {meuPedido.cliente}, retirada: <strong>{meuPedido.retirada}</strong>
          </p>
          <ol className="etapas">
            {nomesEtapas.map((n, i) => (
              <li key={n} className={i <= indice ? 'feita' : ''}>
                {n}
              </li>
            ))}
          </ol>
          {(meuPedido.status === 'recebido' || meuPedido.status === 'preparo') && (
            <p className="etiqueta-preco">
              {naFrente === 0 ? 'Você é o próximo!' : naFrente + (naFrente === 1 ? ' pedido' : ' pedidos') + ' na sua frente'}
            </p>
          )}
          <ul className="resumo">
            {meuPedido.itens.map((i) => (
              <li key={i.id}>
                <span>
                  {i.qtd}× {i.nome}
                </span>
                <span>{fmt(i.preco * i.qtd)}</span>
              </li>
            ))}
            <li className="total">
              <span>Total ({meuPedido.pagamento})</span>
              <span>{fmt(meuPedido.total)}</span>
            </li>
          </ul>
          <button className="botao contorno" onClick={() => setTela('cardapio')}>
            Fazer outro pedido
          </button>
        </section>
      </div>
    )
  }

  // ===================== TELA DE PAGAMENTO =====================
  if (tela === 'pagamento') {
    return (
      <div className="pagina">
        {cabecalho}
        <section className="painel estreito">
          <button className="voltar" onClick={() => setTela('carrinho')}>
            ← Carrinho
          </button>
          <h1 className="display">Pagamento</h1>
          <div className="metodos">
            <label className={'metodo' + (metodo === 'pix' ? ' selecionado' : '')}>
              <input type="radio" name="metodo" checked={metodo === 'pix'} onChange={() => setMetodo('pix')} />
              <span>⚡ Pix</span>
            </label>
            <label className={'metodo' + (metodo === 'cartao' ? ' selecionado' : '')}>
              <input type="radio" name="metodo" checked={metodo === 'cartao'} onChange={() => setMetodo('cartao')} />
              <span>💳 Cartão</span>
            </label>
          </div>
          {metodo === 'pix' && (
            <div className="pix">
              <div className="qr" aria-hidden="true" />
              <p className="suave pequeno">Simulação: o Pix é aprovado assim que você confirmar.</p>
            </div>
          )}
          {metodo === 'cartao' && (
            <div className="form">
              <label>
                Número do cartão
                <input inputMode="numeric" placeholder="0000 0000 0000 0000" value={numeroCartao} onChange={(e) => setNumeroCartao(e.target.value)} />
              </label>
              <div className="linha">
                <label>
                  Validade
                  <input placeholder="MM/AA" value={validade} onChange={(e) => setValidade(e.target.value)} />
                </label>
                <label>
                  CVV
                  <input inputMode="numeric" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                </label>
              </div>
            </div>
          )}
          {erro && <p className="erro">{erro}</p>}
          <button className="botao primario cheio" disabled={processando} onClick={finalizarPedido}>
            {processando ? 'Processando…' : 'Pagar ' + fmt(totalCarrinho)}
          </button>
        </section>
      </div>
    )
  }

  // ===================== TELA DO CARRINHO =====================
  if (tela === 'carrinho') {
    return (
      <div className="pagina">
        {cabecalho}
        <section className="painel estreito">
          <button className="voltar" onClick={() => setTela('cardapio')}>
            ← Cardápio
          </button>
          <h1 className="display">Seu pedido</h1>
          {qtdCarrinho === 0 && <p className="vazio">Carrinho vazio. Bora escolher um lanche?</p>}
          <ul className="resumo">
            {Object.keys(carrinho).map((id) => {
              const item = todosItens.find((i) => i.id === id)
              if (!item) return null
              return (
                <li key={id}>
                  <span>
                    {emoji(item.categoria)} {item.nome}
                  </span>
                  <span className="passo">
                    <button onClick={() => remover(id)}>−</button>
                    {carrinho[id]}
                    <button onClick={() => adicionar(id)}>+</button>
                  </span>
                </li>
              )
            })}
            {qtdCarrinho > 0 && (
              <li className="total">
                <span>Total</span>
                <span>{fmt(totalCarrinho)}</span>
              </li>
            )}
          </ul>
          <div className="form">
            <label>
              Seu nome
              <input placeholder="Como te chamamos no balcão" value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label>
              Retirada
              <select value={retirada} onChange={(e) => setRetirada(e.target.value)}>
                {horarios.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
          </div>
          {erro && <p className="erro">{erro}</p>}
          <button
            className="botao primario cheio"
            disabled={qtdCarrinho === 0}
            onClick={() => {
              if (!nome.trim()) {
                setErro('Coloca teu nome pra gente te chamar no balcão.')
                return
              }
              setErro('')
              setTela('pagamento')
            }}
          >
            Ir para o pagamento
          </button>
        </section>
      </div>
    )
  }

  // ===================== LANDING + CARDÁPIO =====================
  const itensVisiveis = busca.trim()
    ? todosItens.filter((i) => i.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    : todosItens.filter((i) => i.categoria === categoria)
  const reais = Math.floor(itemDestaque.preco)
  const centavos = Math.round((itemDestaque.preco - reais) * 100)

  return (
    <div className="pagina">
      {cabecalho}

      <section className="heroi">
        <h1 className="sr-only">Pula a fila</h1>
        <div className="heroi-titulo" aria-hidden="true">
          <svg viewBox="0 0 1000 250">
            <path id="arco-heroi" d="M 20 235 Q 500 95 980 235" fill="none" />
            <text>
              <textPath href="#arco-heroi" startOffset="50%" textAnchor="middle">
                PULA A FILA
              </textPath>
            </text>
          </svg>
          <span className="tag tag-lilas">Quentinho</span>
          <span className="tag tag-laranja">Sem fila</span>
        </div>

        <div className="heroi-grade">
          <div className="heroi-texto">
            <p className="display-texto">
              Salgados, tapiocas e café da manhã prontos no seu intervalo
            </p>
            <button className="botao-pessego" onClick={() => adicionar(itemDestaque.id)}>
              Pedir agora
            </button>
          </div>

          <div className="heroi-foto">
            {foto('/assets/hero/' + itemDestaque.id + '.png', itemDestaque.nome, 'foto-heroi', 'PNG recortado, sem fundo · 800×1200')}
          </div>

          <div className="heroi-preco">
            <div className="etiqueta-heroi">
              <strong className="preco-grande">
                <span className="moeda">R$</span>
                {reais}
                {centavos > 0 && <sup>,{String(centavos).padStart(2, '0')}</sup>}
              </strong>
              <span className="etiqueta-nome">{itemDestaque.nome}</span>
              <small>{destaques[slide].rotulo}</small>
            </div>
          </div>
        </div>
      </section>

      <div className="carrossel">
        <div className="carrossel-setas">
          <button aria-label="Destaque anterior" onClick={() => setSlide((slide + destaques.length - 1) % destaques.length)}>
            ←
          </button>
          <button aria-label="Próximo destaque" onClick={() => setSlide((slide + 1) % destaques.length)}>
            →
          </button>
        </div>
        <div className="carrossel-pontos">
          {destaques.map((d, i) => (
            <button key={d.id} aria-label={'Destaque ' + (i + 1)} className={i === slide ? 'ativo' : ''} onClick={() => setSlide(i)} />
          ))}
        </div>
      </div>

      {meuPedido && meuPedido.status !== 'retirado' && (
        <button className="aviso-senha" onClick={() => setTela('senha')}>
          <span>
            Sua senha <strong>{meuPedido.senha}</strong> · {meuPedido.status === 'pronto' ? 'pronto pra retirar!' : naFila.length + ' na fila agora'}
          </span>
          <span>Acompanhar →</span>
        </button>
      )}

      <section className="vitrine">
        <h2 className="titulo-secao">Mais pedidos</h2>
        <div className="vitrine-grade">
          {maisPedidos.map((m) => {
            const item = todosItens.find((i) => i.id === m.id)!
            return (
              <article key={item.id} className="destaque-card">
                {foto('/assets/produtos/' + item.id + '.png', item.nome, 'foto-destaque', 'PNG recortado · 600×600')}
                <div className="destaque-corpo">
                  <h3>{item.nome}</h3>
                  <p>{m.descricao}</p>
                  <hr />
                  <strong className="destaque-preco">{fmt(item.preco)}</strong>
                  {carrinho[item.id] ? (
                    <span className="passo">
                      <button onClick={() => remover(item.id)}>−</button>
                      {carrinho[item.id]}
                      <button onClick={() => adicionar(item.id)}>+</button>
                    </span>
                  ) : (
                    <button className="botao-card" onClick={() => adicionar(item.id)}>
                      Adicionar
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="vitrine" id="cardapio">
        <h2 className="titulo-secao">Cardápio</h2>
        <input className="busca" type="search" placeholder="Buscar no cardápio…" value={busca} onChange={(e) => setBusca(e.target.value)} />

        {!busca.trim() && (
          <div className="categorias">
            {cardapio.categorias.map((c) => (
              <button key={c.nome} className={'chip' + (c.nome === categoria ? ' ativo' : '')} onClick={() => setCategoria(c.nome)}>
                {emoji(c.nome)} {c.nome}
              </button>
            ))}
          </div>
        )}

        <div className="grade">
          {itensVisiveis.map((item) => (
            <article key={item.id} className="card">
              {foto('/assets/produtos/' + item.id + '.png', item.nome, 'foto-card', '600×600')}
              <h3>{item.nome}</h3>
              <span className="preco">{fmt(item.preco)}</span>
              {carrinho[item.id] ? (
                <span className="passo">
                  <button onClick={() => remover(item.id)}>−</button>
                  {carrinho[item.id]}
                  <button onClick={() => adicionar(item.id)}>+</button>
                </span>
              ) : (
                <button className="botao-card" onClick={() => adicionar(item.id)}>
                  Adicionar
                </button>
              )}
            </article>
          ))}
          {itensVisiveis.length === 0 && <p className="vazio">Nada encontrado.</p>}
        </div>
      </section>

      <footer className="rodape">
        <span>Imperial Padaria · Quiosque Brum · CESAR School</span>
        <a href="#/balcao">Área do balcão →</a>
      </footer>

      {qtdCarrinho > 0 && (
        <button className="barra-carrinho" onClick={() => setTela('carrinho')}>
          <span>
            {qtdCarrinho} {qtdCarrinho === 1 ? 'item' : 'itens'}
          </span>
          <strong>Ver pedido · {fmt(totalCarrinho)}</strong>
        </button>
      )}
    </div>
  )
}
