
/**
 * Utilitário para adicionar marca d'água (Timestamp e Geolocalização) em imagens
 * Reposicionado para a parte inferior seguindo o padrão "GPS Map Camera".
 * Margens de 2cm (aprox. 7.5% da largura).
 * Removido painel de fundo para visual limpo.
 */

interface WatermarkData {
  address: string;
  lat: number;
  lng: number;
  userName: string;
  date: Date;
}

export const addWatermarkToImage = (
  base64Image: string,
  data: WatermarkData
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!base64Image.startsWith('data:')) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        reject(new Error('Não foi possível obter o contexto do canvas'));
        return;
      }

      const TARGET_WIDTH = Math.min(img.width, 1600); 
      const ratio = TARGET_WIDTH / img.width;
      const TARGET_HEIGHT = img.height * ratio;

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      const scale = TARGET_WIDTH / 1000;
      const marginX = TARGET_WIDTH * 0.065; 
      const marginY = TARGET_WIDTH * 0.065; 

      // Configurações de Texto
      const panelWidth = TARGET_WIDTH - (marginX * 2);
      const startX = marginX;
      const bottomY = TARGET_HEIGHT - marginY;

      // Adicionamos uma sombra projetada (Drop Shadow) para que o texto seja legível
      // mesmo sem o fundo escuro, caso a imagem seja muito clara.
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 2 * scale;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      // 1. RODAPÉ TÉCNICO E GPS (Linha inferior)
      const footerText = `Resp: ${data.userName}  |  GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
      ctx.font = `bold ${18 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = '#facc15'; // Amarelo para destaque técnico
      ctx.fillText(footerText, startX, bottomY);

      // 2. DATA E HORA (Acima do rodapé)
      const dateStr = data.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = data.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      ctx.font = `500 ${19 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const dateY = bottomY - (30 * scale);
      ctx.fillText(`${dateStr}  ${timeStr}`, startX, dateY);

      // 3. ENDEREÇO DETALHADO (Acima da data)
      ctx.font = `500 ${21 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      
      const addressParts = data.address.split(',');
      const fullAddress = addressParts.slice(1).join(',').trim() || data.address;
      const wrappedLines = wrapText(ctx, fullAddress, panelWidth);
      
      let addressY = dateY - (30 * scale);
      // Desenhamos as linhas de baixo para cima
      wrappedLines.slice(0, 2).reverse().forEach(line => {
        ctx.fillText(line, startX, addressY);
        addressY -= 26 * scale;
      });

      // 4. TÍTULO (Logradouro Principal) - No topo do bloco de texto
      const locationTitle = addressParts[0] || "Vistoria Identificada";
      ctx.font = `bold ${34 * scale}px "Inter", sans-serif, system-ui`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(locationTitle, startX, addressY - (10 * scale));

      // Reseta a sombra para não afetar outros processos se houver
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };

    img.onerror = () => {
      reject(new Error('Erro no carregamento da imagem original'));
    };

    img.src = base64Image;
  });
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
