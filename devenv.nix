{ pkgs, ... }: {
  # https://devenv.sh/reference/options/
  # ! not maintained by @mbnuqw - report issues here: https://github.com/onezoomin/sidebery/issues

  languages.javascript = {
    enable = true; # adds node LTS & npm
    # package = pkgs.nodejs-18_x; <- if you need to override npm version
  };

  packages = with pkgs; [
    # Add packages here - search: https://search.nixos.org/packages?channel=unstable&query=
    #gcc
    #nodePackages.pnpm
  ];
}
