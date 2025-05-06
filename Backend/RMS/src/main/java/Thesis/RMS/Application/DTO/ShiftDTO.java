package Thesis.RMS.Application.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ShiftDTO {
    private Long staffId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
    