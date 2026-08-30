# IMF Turismo

Sistema web de gestão e planejamento de excursões da IMF Turismo — trabalho
final do curso Técnico em Informática (CEMI-Gama).

## Stack

- **client/** — Front-end React (Vite) + Styled Components, integrado ao Supabase.
- **server/** — Back-end Python/FastAPI com pytest (TDD) e Supabase.

## Documentação

- Regras e especificação do produto: [`.opencode/PRODUCT.md`](.opencode/PRODUCT.md)
- Decisões de arquitetura: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)

## Configuração

Copie `.env.example` para `.env` e preencha as variáveis (Supabase e API).
Nunca versione o `.env` (seção 6.3 do PRODUCT.md).
