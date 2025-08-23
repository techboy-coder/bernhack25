{ pkgs ? import <nixpkgs> {} } :
pkgs.mkShell {
  buildInputs = [
    pkgs.docker
    pkgs.python3
    pkgs.python312Packages.flask
    pkgs.python312Packages.requests
  ];
}
