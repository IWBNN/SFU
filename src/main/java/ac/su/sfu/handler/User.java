package ac.su.sfu.handler;

import lombok.Getter;
import lombok.Setter;
import java.io.Serializable;
import java.util.List;

@Getter
@Setter
public class User {
    private Long userId;

    private String username;
    private String nickname;
    private String password;
    private String email;

}
