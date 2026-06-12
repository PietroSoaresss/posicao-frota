package br.com.pavi.api.auth;

import br.com.pavi.api.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional
public class UserManagementService {

    private static final Set<String> ALLOWED_ROLES = Set.of("ADMIN", "OPERADOR");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse create(CreateUserRequest request) {
        String username = normalizeUsername(request.username());
        String role = normalizeRole(request.role());

        ensureUsernameAvailable(username, null);

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);

        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse update(Long id, UpdateUserRequest request, String currentUsername) {
        User existing = findById(id);
        User currentUser = findByUsername(currentUsername);
        String username = normalizeUsername(request.username());
        String role = normalizeRole(request.role());

        ensureUsernameAvailable(username, existing.getId());

        if (currentUser.getId().equals(existing.getId()) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Você não pode rebaixar o próprio usuário para OPERADOR.");
        }

        existing.setUsername(username);
        existing.setRole(role);
        return UserResponse.from(userRepository.save(existing));
    }

    public void delete(Long id, String currentUsername) {
        User existing = findById(id);
        User currentUser = findByUsername(currentUsername);

        if (currentUser.getId().equals(existing.getId())) {
            throw new IllegalArgumentException("Você não pode excluir o próprio usuário.");
        }

        userRepository.delete(existing);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    private User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + username));
    }

    private void ensureUsernameAvailable(String username, Long currentId) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (currentId == null || !user.getId().equals(currentId)) {
                throw new IllegalArgumentException("Username já está em uso.");
            }
        });
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Username é obrigatório.");
        }
        return normalized;
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(normalized)) {
            throw new IllegalArgumentException("Role inválido. Use ADMIN ou OPERADOR.");
        }
        return normalized;
    }
}
