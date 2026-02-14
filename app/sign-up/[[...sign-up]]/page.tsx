import SignUpClient from './SignUpClient'

export function generateStaticParams() {
  return [{ 'sign-up': [] }]
}

export default function SignUpPage() {
  return <SignUpClient />
}
