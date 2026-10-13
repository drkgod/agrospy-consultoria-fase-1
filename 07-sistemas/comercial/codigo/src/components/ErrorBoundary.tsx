import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

// Rede de segurança: um erro de renderização em qualquer tela mostra a mensagem e o
// botão de recarregar — a página nunca mais "some" sem explicação (bug 12/10: o
// popover do Radix quebrava no Safari do iPhone e derrubava a árvore inteira).
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="container mx-auto py-10 px-4">
          <h1 className="text-xl font-bold mb-2">Algo deu errado nesta tela</h1>
          <p className="text-muted-foreground mb-2">
            Tente recarregar; se persistir, me informe o que estava fazendo.
          </p>
          <pre className="mb-4 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
            {String(this.state.erro?.message ?? this.state.erro)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
