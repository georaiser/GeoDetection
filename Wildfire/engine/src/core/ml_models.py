import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    """
    Splits multi-spectral satellite imagery into patches and projects them into an embedding space.
    """
    def __init__(self, in_channels=13, patch_size=16, embed_dim=768):
        super().__init__()
        self.patch_size = patch_size
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        # x: (B, C, H, W) -> (B, embed_dim, H/P, W/P)
        x = self.proj(x)
        # Flatten spatial dimensions: (B, embed_dim, N)
        x = x.flatten(2)
        # Transpose: (B, N, embed_dim)
        return x.transpose(1, 2)

class WildfireEncoderParams:
    def __init__(self):
        self.in_channels = 21 # Fused GOES (16) + VIIRS (5) bands
        self.patch_size = 16
        self.embed_dim = 256  # lightweight embedding size
        self.depth = 4        # fewer layers for a lightweight model
        self.num_heads = 8
        self.mlp_ratio = 4.0

class WildfireViT(nn.Module):
    """
    A lightweight Vision Transformer tailored for Wildfire Detection.
    Takes fused GOES/VIIRS multi-band imagery and produces a dense embedding.
    Built from scratch as an alternative to large foundation models.
    """
    def __init__(self, config=WildfireEncoderParams()):
        super().__init__()
        self.patch_embed = PatchEmbedding(config.in_channels, config.patch_size, config.embed_dim)
        
        # Class token and positional embeddings
        self.cls_token = nn.Parameter(torch.zeros(1, 1, config.embed_dim))
        # Assuming typical tile size of 224x224
        num_patches = (224 // config.patch_size) ** 2
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, config.embed_dim))
        self.pos_drop = nn.Dropout(p=0.1)

        # Transformer blocks
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=config.embed_dim,
            nhead=config.num_heads,
            dim_feedforward=int(config.embed_dim * config.mlp_ratio),
            dropout=0.1,
            activation='gelu',
            batch_first=True
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=config.depth)
        self.norm = nn.LayerNorm(config.embed_dim)

    def forward(self, x):
        # x: (B, 21, 224, 224)
        B = x.shape[0]
        x = self.patch_embed(x)

        # Prepend cls token
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        # Add positional embedding
        x = x + self.pos_embed
        x = self.pos_drop(x)

        # Apply transformer
        x = self.encoder(x)
        
        # Take the cls token representation as the global embedding
        x = self.norm(x[:, 0])
        return x

def get_wildfire_encoder():
    """Factory function to instantiate the from-scratch WildfireEncoder."""
    model = WildfireViT()
    # In a real scenario, we would load custom pre-trained contrastive weights here:
    # model.load_state_dict(torch.load("weights/wildfire_encoder_simclr.pth"))
    return model
