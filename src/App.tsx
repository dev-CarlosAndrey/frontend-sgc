import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/pt-br';
import { MantineProvider, createTheme } from "@mantine/core"
import { DatesProvider } from "@mantine/dates"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { AppRoutes } from "./routes"

const theme = createTheme({
  primaryColor: 'teal',
});

function App() {
  return (
    <BrowserRouter>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {/* Padroniza os campos de data em dd/mm/yyyy e pt-BR (nomes de mês/semana no calendário),
            independente do idioma configurado no navegador/SO do usuário. */}
        <DatesProvider settings={{ locale: 'pt-br' }}>
          <AuthProvider>
            <AppRoutes/>
          </AuthProvider>
        </DatesProvider>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App