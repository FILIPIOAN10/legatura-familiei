package ro.exitusro.api.common;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

/**
 * Generic Hibernate UserType that maps a Java enum to a Postgres native enum column.
 * Subclass it per-enum (see e.g. {@code AppRoleType}).
 */
public abstract class PostgresEnumType<E extends Enum<E>> implements UserType<E> {

    private final Class<E> enumClass;

    protected PostgresEnumType(Class<E> enumClass) {
        this.enumClass = enumClass;
    }

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<E> returnedClass() {
        return enumClass;
    }

    @Override
    public boolean equals(E x, E y) {
        return x == y;
    }

    @Override
    public int hashCode(E x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public E nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return value == null ? null : Enum.valueOf(enumClass, value);
    }

    @Override
    public void nullSafeSet(PreparedStatement st, E value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name(), Types.OTHER);
        }
    }

    @Override
    public E deepCopy(E value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(E value) {
        return value;
    }

    @Override
    public E assemble(Serializable cached, Object owner) throws HibernateException {
        return (E) cached;
    }

    @Override
    public E replace(E detached, E managed, Object owner) {
        return detached;
    }
}
