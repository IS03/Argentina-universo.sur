// Pins for the exact versions authorized by the project owner on 2026-10-26.
// Digests prove integrity, not cryptographic identity. Original authorization remains private.
export const AUTHORIZATION_DIGEST = "d4f9b5c80e83c58aa352484c897e59dc11c080005134051df44144b93863a671";
export const AUTHORIZED_DESTINATIONS = {
  "santa-fe-capital": {
    "hashes": {
      "payload": "e1aeed28652e5de80021ec37f756611c50ff72220878d3e6632c7511a571d721",
      "scope": "4b2ad19c240397f6bfab96c85466f59b93ae8c0f7c0cbacd69ddc03382bb54dc",
      "evidence": "0fee9da276b4c02e59298ab24755c94c6bacb5845a8605f2fc2f9fa931a45e78",
      "media": "596bb0547e59d8dde031cf55bb199b3df150fd2d17ebf27e8e96acc6070504ab"
    },
    "assetsHash": "53dc3a76e75bd29eefb8c8eedff62d42040b654848192cc2f9a2b3da05cd2303"
  },
  "alta-gracia": {
    "hashes": {
      "payload": "6250a983aad83b6d2ae4e986e23e5850d30f6daa1a135021fdf456422b91afec",
      "scope": "52e44c1c402658d8fc8334760fa03a7131992c1a8baf84fe76d0ad832663ba52",
      "evidence": "c4bb52edfea1997440190bffee266bcceb5975db227dfc672f55261955b436e7",
      "media": "51f2f909186bc9a3add805b08caca12d63b0e15bb629599f47bbaa8b8101d33b"
    },
    "assetsHash": "5f0e8c0c5c925f818795c21f78d43305217e96e633f90c924c4ad0868f769cf2"
  }
} as const;
