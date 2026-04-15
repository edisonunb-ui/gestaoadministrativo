# Para saber mais sobre como usar o Nix para configurar seu ambiente
# veja: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Qual canal do nixpkgs usar.
  channel = "stable-24.11"; # ou "unstable"
  
  # Use https://search.nixos.org/packages para encontrar pacotes
  packages = [
    pkgs.nodejs_22 # Instala Node.js para usar 'serve'
  ];
  
  # Define variáveis de ambiente no workspace
  env = {};
  
  idx = {
    # Procure as extensões que você deseja em https://open-vsx.org/ e use "publisher.id"
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];
    
    # Habilita o preview e define o comando do servidor web
    previews = {
      enable = true;
      previews = {
        web = {
          # Este comando inicia o servidor 'serve' na porta fornecida pelo IDX.
          # O 'serve' serve a pasta atual (onde os arquivos HTML/CSS/JS estão).
          command = ["serve", "-l", "$PORT"];
          manager = "web";
        };
      };
    };
    
    # Hooks do ciclo de vida do workspace
    workspace = {
      # Roda quando um workspace é criado pela primeira vez
      onCreate = {
        default.openFiles = [ "index.html" "services/firebase.js" ];
        install-serve = "npm install -g serve"; # Instala 'serve' globalmente
      };
      # Roda quando o workspace é (re)iniciado
      onStart = {
        # Não é necessário um comando onStart adicional, pois 'serve' é iniciado no preview.
      };
    };
  };
}
