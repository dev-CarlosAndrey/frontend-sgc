import { 
  Center, 
  Container, 
  Title, 
  Text, 
  Paper, 
  TextInput, 
  PasswordInput, 
  Group, 
  Checkbox, 
  Anchor, 
  Button,
  Alert 
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconUser, IconLock, IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { User } from "../../types/auth";

export function LoginScreen() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
    },

    validate: {
      username: (value) => (value.trim().length < 3 ? 'O usuário deve ter pelo menos 3 caracteres' : null),
      password: (value) => (value.length < 6 ? 'A senha deve ter pelo menos 6 caracteres' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setErrorMessage(null); 
    
    try {
      const isLoginSuccessful = await login(values.username, values.password);

      if (isLoginSuccessful) {
        // O Dashboard é restrito a ADMIN (seção 4 do contrato) — demais papéis
        // vão direto para uma tela acessível a qualquer usuário autenticado.
        const storedUser = localStorage.getItem('@SGC:user');
        const loggedUser: User | null = storedUser ? JSON.parse(storedUser) : null;
        navigate(loggedUser?.role === 'ADMIN' ? '/dashboard' : '/service-orders');
      }
    } catch (error: any) { 
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          setErrorMessage("Usuário ou senha incorretos.");
        } else if (error.response.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Falha ao processar o login. Tente novamente mais tarde.");
        }
      } else {
        setErrorMessage("Erro ao conectar com o servidor. Verifique se o backend Java está rodando.");
      }
    }
  };

  return (
    <Center style={{ width: '100vw', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container size={420} my={40} style={{ width: '100%' }}>
        <Title ta="center" style={{ fontWeight: 900, fontFamily: 'Greycliff CF, sans-serif' }}>
          SGC
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Bem-vindo de volta! Por favor, insira suas credenciais.
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            
            {errorMessage && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                title="Falha na Autenticação" 
                color="red" 
                radius="md" 
                mb="md"
              >
                {errorMessage}
              </Alert>
            )}
            
            <TextInput
              label="Usuário"
              placeholder="Seu nome de usuário"
              required
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('username')}
            />

            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              mt="md"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('password')}
            />

            <Group justify="space-between" mt="lg">
              <Checkbox 
                label="Lembrar de mim" 
                {...form.getInputProps('rememberMe', { type: 'checkbox' })} 
              />
              <Anchor component="button" size="sm" type="button">
                Esqueceu a senha?
              </Anchor>
            </Group>

            <Button type="submit" fullWidth mt="xl" radius="md" loading={loading}>
              Entrar no Sistema
            </Button>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}